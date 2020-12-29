module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 289:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_PERMISSIONS_MAP = exports.DEFAULT_PERMISSIONS_MAP_ID = exports.RECOVERY_PERMISSIONS_MAP_ID = exports.REDIS_TOKENS_BLACKLIST = exports.TOKEN_BEARER = exports.TOKEN_BEARER_KEY = exports.ACCESS_TOKEN_EMPTY_ISSUER = exports.ACCESS_TOKEN_EMPTY_UUID = exports.ACCESS_TOKEN_EMPTY_ID = exports.LOG_FILENAME_AUTH = exports.DEFAULT_SIGNATURE_ISSUER = exports.DEFAULT_SIGNATURE_ALGORITHM = exports.DEFAULT_REFRESH_TOKEN_EXPIRED = exports.DEFAULT_ACCESS_TOKEN_EXPIRED = void 0;
exports.DEFAULT_ACCESS_TOKEN_EXPIRED = 1800;
exports.DEFAULT_REFRESH_TOKEN_EXPIRED = 2.592e6;
exports.DEFAULT_SIGNATURE_ALGORITHM = 'RS256';
exports.DEFAULT_SIGNATURE_ISSUER = 'via-profit-services';
exports.LOG_FILENAME_AUTH = 'auth-%DATE%.log';
exports.ACCESS_TOKEN_EMPTY_ID = 'NOT_ASSIGNED';
exports.ACCESS_TOKEN_EMPTY_UUID = 'NOT_ASSIGNED';
exports.ACCESS_TOKEN_EMPTY_ISSUER = 'NOT_ASSIGNED';
exports.TOKEN_BEARER_KEY = 'Authorization';
exports.TOKEN_BEARER = 'Bearer';
exports.REDIS_TOKENS_BLACKLIST = 'tokensBlackList';
exports.RECOVERY_PERMISSIONS_MAP_ID = 'ff11ef55-d26b-46ba-8c9c-3f93b899f09e';
exports.DEFAULT_PERMISSIONS_MAP_ID = '63833b93-b253-414c-a3fc-ca5211430222';
exports.DEFAULT_PERMISSIONS_MAP = {
    AuthentificationMutation: {
        grant: ['*'],
    },
    TokenBag: {
        grant: ['*'],
    },
    TokenRegistrationError: {
        grant: ['*'],
    },
    AccessToken: {
        grant: ['*'],
    },
    RefreshToken: {
        grant: ['*'],
    },
    AccessTokenPayload: {
        grant: ['*'],
    },
    RefreshTokenPayload: {
        grant: ['*'],
    },
};


/***/ }),

/***/ 503:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.down = exports.up = void 0;
const constants_1 = __webpack_require__(289);
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.raw(`
    DROP TABLE IF EXISTS roles CASCADE;

    CREATE TABLE roles (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT roles_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "privileges" CASCADE;
      CREATE TABLE "privileges" (
      "name" varchar(100) NOT NULL,
      "description" text NULL,
      CONSTRAINT privileges_pk PRIMARY KEY (name)
    );

    DROP TABLE IF EXISTS "permissions" CASCADE;
    CREATE TABLE "permissions" (
      "role" varchar(100) NOT NULL,
      "privilege" varchar(100) NOT NULL,
      CONSTRAINT permissions_un UNIQUE (role, privilege)
    );

    DROP TABLE IF EXISTS "permissionsMap" CASCADE;
    CREATE TABLE "permissionsMap" (
      "id" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "map" jsonb default '{}',
      "description" text,
      CONSTRAINT "permissionsMap_pk" PRIMARY KEY (id)
    );

    ALTER TABLE permissions ADD CONSTRAINT permissions_privilege_fk FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE permissions ADD CONSTRAINT permissions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  
    -- insert default roles set
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('administrator', 'Accounts have this role can make all requests without limits.'),
      ('authorized', 'Accounts have this role can make request only with valid authorization credentials.');

    -- insert Unlimited access privilege
    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access');

    -- insert permission
    insert into permissions
      ("role", "privilege")
    values
      ('developer', '*'),
      ('administrator', '*');

    -- insert permissions map
    insert into "permissionsMap"
      ("id", "map", "description")
    values
      ('${constants_1.RECOVERY_PERMISSIONS_MAP_ID}', '${JSON.stringify(constants_1.DEFAULT_PERMISSIONS_MAP)}', 'Recovery map. Do not change this map, so that you can always return the map in case of incorrect editing'),
      ('${constants_1.DEFAULT_PERMISSIONS_MAP_ID}', '${JSON.stringify(constants_1.DEFAULT_PERMISSIONS_MAP)}', 'Standard map');
  `);
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.raw(`
    DROP TABLE IF EXISTS "permissions" CASCADE;
    DROP TABLE IF EXISTS "privileges" CASCADE;
    DROP TABLE IF EXISTS "roles" CASCADE;
    DROP TABLE IF EXISTS "permissionsMap" CASCADE;
  `);
    });
}
exports.down = down;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(503);
/******/ })()
;