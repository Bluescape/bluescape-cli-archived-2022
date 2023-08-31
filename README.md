## Install

### npm
you can install `bluescape cli` via npm.

```sh
$ npm install bluescape/bluescape-cli-archived-2022#latest -g
```


## Basic Usage

### Setup

Configure a instance

```sh
$ bluescape config set instance
```

### Login

```sh
$ bluescape login
```

### Session
Get current session user & instance 
```sh
$ bluescape whoami
```


### User Management

User Get
```sh
# Get user by Id.
$ bluescape user get <userId|email> 
$ bluescape user get <userId|email>  --attributes=id,email,metadata
```

User Delete
- [--from-csv]: CSV File Path Format  [sample file](https://github.com/Bluescape/bluescape-cli/blob/main/sample/user_delete.csv)

- [--new-owner-id]: If deleted user own workspace, we will re-asssign this user as owner.

- [--force]: force flag will be delete user permanetly from database.


```sh

#Delete user by email Id and CSV file
$ bluescape user delete --from-csv=./sample/user_delete.csv --new-owner-id=zANz6n3RKfNXO01a36EY --force

# Add custom link to the users in the CSV file user by email Id and CSV file
$ bluescape customlink add --from-csv=./sample/customlink.csv --blocked-domains=./sample/blocked-domains.csv
```
### Siloed User Provisioning
```sh
# Enable autoAssociateIdentityProviderUser for an organization and add an account to an organization
# Both organizationId and accountId are optional. So we can execute both (valid Ids) or at least one argument is required.
$ bluescape siloeduserprovision set --organizationId="ORGANIZATION_UID" --accountId="ACCOUNT_UID"
```


## Uninstall

### npm
you can uninstall `bluescape cli` via npm.

```sh
$ npm uninstall  @bluescape/cli -g
```

### Provisioning license quantity of a legacy enterprise

```sh
# Link an external legacy enterprise subscription to the organization
$ bluescape provisionlicense link-external-legacy-subscription
```
