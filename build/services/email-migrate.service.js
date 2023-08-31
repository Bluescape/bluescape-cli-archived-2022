"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMigrationService = exports.validateEmail = exports.csvFileDataValidation = void 0;
const validator_1 = __importDefault(require("validator"));
const role_types_1 = require("../commands/user/role.types");
const validators_1 = require("../utils/validators");
const fetch_service_1 = require("./fetch.service");
const index_1 = require("./index");
const userAttributes = ['id', 'email'];
const roleAttributes = ['id', 'type'];
const toFindDuplicateElements = (ele) => ele.filter((item, index) => ele.indexOf(item) !== index && item.length > 0);
const csvFileDataValidation = (mappingData) => {
    const mappedEmails = [];
    if (mappingData.length === 0) {
        throw new Error(`CSV file is empty. Please provide atleast one user existing email address to migrate.`);
    }
    if (!mappingData[0].hasOwnProperty('Existing Email') ||
        !mappingData[0].hasOwnProperty('SSO Email') ||
        !mappingData[0].hasOwnProperty('Workspace Reassignment Email')) {
        throw new Error(`CSV file should have expected column headers - Existing Email, SSO Email, Workspace Reassignment Email.`);
    }
    mappingData.forEach((email) => {
        mappedEmails.push({
            existing: email['Existing Email'].toLowerCase(),
            sso: email['SSO Email'].toLowerCase(),
            workspaceOwner: email['Workspace Reassignment Email'].toLowerCase(),
        });
    });
    const allEmails = [];
    mappedEmails.map((email) => {
        allEmails.push(email.existing);
        allEmails.push(email.sso);
    });
    const duplicateEmails = toFindDuplicateElements(allEmails);
    if (duplicateEmails.length > 0) {
        throw new Error(`CSV file contains the duplicate email(s) - ${duplicateEmails.concat('\n')}`);
    }
    return mappedEmails;
};
exports.csvFileDataValidation = csvFileDataValidation;
const validateEmail = (email) => {
    if (!validator_1.default.isEmail(email)) {
        const message = `Invalid email format `;
        return { error: message };
    }
    return true;
};
exports.validateEmail = validateEmail;
class EmailMigrationService extends fetch_service_1.FetchService {
    constructor() {
        super();
    }
    async checkIfUserBelongsToManyOrganizations(userId) {
        const { data, error } = await index_1.userService.getUserOrganizationsExcludingPersonalSpace(userId, 100);
        if (error) {
            return { error: `Failed to fetch user organizations ${error}` };
        }
        if (data?.organizations && data?.organizations.length > 1) {
            return true;
        }
        return false;
    }
    async validateSessionUserRole(userEmail, roleType) {
        const { data, errors: userExistenceError } = await index_1.userService.getUserFromEmail(userEmail, [
            'id',
            'applicationRole{type}',
        ]);
        if (userExistenceError) {
            const [{ message }] = userExistenceError;
            return { error: message };
        }
        const sessionUser = data?.user || {};
        if (sessionUser?.applicationRole?.type !== roleType) {
            return false;
        }
        return true;
    }
    async getOrganizationOwner(organizationId) {
        const { data, errors: ownerExistenceError } = await index_1.organizationService.getOrganizationOwner(organizationId, [
            'id',
            'email',
        ]);
        if (ownerExistenceError) {
            const [{ message }] = ownerExistenceError;
            return { error: message };
        }
        const orgOwner = data?.organization || {};
        if (orgOwner?.members?.results && orgOwner?.members?.results.length > 0) {
            const orgOwnerEmail = orgOwner.members.results[0].member.email;
            return orgOwnerEmail;
        }
        return false;
    }
    async getOrganizationMemberByEmail(organizationId, email) {
        const userAttributes = ['id', 'email'];
        const roleAttributes = ['id', 'type'];
        const { data, errors: memberExistenceError } = await index_1.organizationService.getOrganizationMemberByEmail(organizationId, email, userAttributes, roleAttributes);
        if (memberExistenceError) {
            const [{ message }] = memberExistenceError;
            return { error: message };
        }
        const orgMember = data?.organization?.members?.results || [];
        let member;
        if (orgMember.length > 0) {
            member = {
                id: orgMember[0].member.id,
                email: orgMember[0].member.email,
                role: {
                    id: orgMember[0].organizationRole.id,
                    type: orgMember[0].organizationRole.type,
                },
            };
        }
        return member;
    }
    async addMemberToOrganization(organizationId, userId, organizationRoleId) {
        const { data, errors: existenceError } = await index_1.organizationService.addMemberToOrganization(organizationId, userId, organizationRoleId, userAttributes, roleAttributes);
        if (existenceError) {
            const [{ message }] = existenceError;
            return { error: message };
        }
        const orgMember = data?.addMember || {};
        let member;
        if ((0, validators_1.valueExists)(orgMember)) {
            const { member: { id, email }, organizationRole: { id: orgRoleId, type }, } = orgMember;
            member = {
                id,
                email,
                role: {
                    id: orgRoleId,
                    type,
                },
            };
        }
        return member;
    }
    async getOrganizationRoleByType(organizationId, type) {
        const { data, errors: existenceError } = await index_1.organizationService.getOrganizationRoleByType(organizationId, roleAttributes, type);
        if (existenceError) {
            const [{ message }] = existenceError;
            return { error: message };
        }
        const visitorRole = data?.roles?.results || [];
        if (visitorRole.length > 0) {
            return visitorRole[0].id;
        }
        return null;
    }
    async requestToTransferMemberResourcesInOrganization(organizationId, sourceMemberId, targetMemberId) {
        const { data, errors: existenceError } = await index_1.organizationService.requestToTransferMemberResourcesInOrganization(organizationId, sourceMemberId, targetMemberId);
        if (existenceError) {
            const [{ message, extensions }] = existenceError;
            const error = {
                message,
                statusCode: extensions.statusCode,
            };
            return { error };
        }
        const requestSent = data?.requestTransferMemberResources || false;
        if ((0, validators_1.valueExists)(requestSent)) {
            return true;
        }
        return false;
    }
    async updateUserEmail(userId, email) {
        const { data, errors: updateEmailError } = await index_1.userService.updateUserEmail(userId, email, userAttributes);
        if (updateEmailError) {
            const [{ message }] = updateEmailError;
            return { error: message };
        }
        return data;
    }
    async splitOrMergeAccount(organizationId, ssoEmail, targetMemberId) {
        let targetMember;
        let isOrgMember = false;
        if (!(0, validators_1.valueExists)(targetMemberId)) {
            const { data, errors: existenceError } = await index_1.userService.createUserWithoutOrganization(ssoEmail);
            if (existenceError) {
                const [{ message, extensions }] = existenceError;
                const error = {
                    message,
                    statusCode: extensions.statusCode,
                };
                return { error };
            }
            targetMember = data || false;
        }
        else {
            const getTargetOrgMember = await this.getOrganizationMemberByEmail(organizationId, ssoEmail);
            if (getTargetOrgMember && getTargetOrgMember?.error) {
                return { error: getTargetOrgMember?.error };
            }
            if (getTargetOrgMember) {
                isOrgMember = true;
            }
        }
        if (!isOrgMember) {
            const memberRole = await this.getOrganizationRoleByType(organizationId, role_types_1.Roles.User);
            if (memberRole?.error) {
                return { error: memberRole?.error };
            }
            const addOrgMember = await this.addMemberToOrganization(organizationId, (0, validators_1.valueExists)(targetMember?.id) ? targetMember.id : targetMemberId, memberRole);
            if (addOrgMember && addOrgMember?.error) {
                return { error: addOrgMember?.error };
            }
        }
        return (0, validators_1.valueExists)(targetMember?.id) ? targetMember.id : targetMemberId;
    }
}
exports.EmailMigrationService = EmailMigrationService;
//# sourceMappingURL=email-migrate.service.js.map