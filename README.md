MediaWiki Extension Service
===========================
This app is a service intended to be run on [Wikimedia Tool Labs](https://wikitech.wikimedia.org/wiki/Help:Tool_Labs).

It includes a cron job that fetches the git repositories for a number of MediaWiki extensions and extracts certain bits of metadata about the extension into a database. That metadata is then exposed to a simple HTTP API.

The intended consumer of this API is a cli tool which simplifies the installation and upgrading of MediaWiki extensions.

## Setup
Clone the git repository. For now at least this package will not be published to npm.
```console
$ git clone https://github.com/redwerks/mediawiki-extensionservice.git
$ cd mediawiki-extensionservice/
```

Install the local dependencies and necessary global commands via npm.<br>

<i>`sudo` may be required for the `-g` commands if you have not changed ownership of the global directory</i>

```console
# For development
$ npm install
$ npm install -g sequelize-cli
# Or for production
$ npm install --production
$ npm install -g sequelize-cli
```

Install the database adapter for whatever database software you intend to use.
```console
$ npm install sqlite3 # sqlite
$ npm install mysql # mysql
$ npm install mariasql # mariadb
$ npm install pg pg-hstore # postgres
$ npm install tedious # mssql
```

Setup a database and configure the service, see [Configuration](#configuration) for information on how.

Do a database migration to install the database tables.
```console
$ sequelize db:migrate
```

See [Using](#using) for information on how to populate the database and what cron job you need to setup.

## Configuration
MediaWiki Extension Service is configured using environment variables. You can pass configuration to the commands directly or store them in an `.env` file in the cwd.

### Storage
A storage directory is necessary for storage of the bare git repositories of extensions that the service clones and fetches.

Note that while the job will re-clone any repository that disappears it is still more efficient to fetch updates if possible. So while it is acceptable for the storage location to be a temporary directory if run in a grid a shared directory should be used so repositories are not re-cloned on every new machine.

```shell
STORAGE_DIR=[./path/to/storage]
```

### Database
A database to store extension metadata is required, [sequelize](http://sequelizejs.com/) is used to manage it.

Sequelize supports sqlite, mysql, mariadb, postgres, and mssql. `DATABASE_TYPE` is required for all database types. The other required environment variables depend on the database type.

For sqlite the `DATABASE_STORAGE` environment variable is required.
```shell
DATABASE_TYPE=sqlite
DATABASE_STORAGE=[./path/to/db.sqlite]
```

For all other database types the `DATABASE_NAME` ,`DATABASE_USER`, and `DATABASE_PASS` environment variables are required.
```shell
DATABASE_TYPE=[mysql|mariadb|postgres|mssql]
DATABASE_NAME=
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASS=
DATABASE_PORT=
```

## Using
MediaWiki Extension Service's extension metadata extraction is handled by its cron job script.

To run it execute:
```console
$ bin/cron.js
```

If you are running this repeatedly during development you can pass the `--no-fetch` argument to skip fetching updates for extensions that have already been cloned.

To run the service in production bin/cron.js must be run periodically as part of a cron job. The service avoids storing any frequently modified data that needs to be kept up to date so once a day should be acceptable.