## Install

### npm
you can install `bluescape` via npm.

```sh
$ npm install bluescape-cli -g
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
$ bluescape user get <userId>
```

User Delete
- [--from-csv]: CSV File Path Format  [sample file](https://github.com/Bluescape/bluescape-cli/blob/main/sample/user_delete.csv)

- [--new-owner-id]: If deleted user own workspace, we will re-asssign this user as owner.

- [--force]: force flag will be delete user permanetly from database.


```sh
# Delete user by Id
$ bluescape user delete <userId>  --new-owner-id=zANz6n3RKfNXO01a36EY --force

#Delete user by email Id and CSV file
$ bluescape user delete --from-csv=/Users/enclta042/bs/isam-cli/sample/user_delete.csv --new-owner-id=zANz6n3RKfNXO01a36EY --force
```

