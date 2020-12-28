module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 503:
/***/ (function(__unused_webpack_module, exports) {


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

    ALTER TABLE permissions ADD CONSTRAINT permissions_privilege_fk FOREIGN KEY (privilege) REFERENCES privileges(name) ON DELETE CASCADE;
    ALTER TABLE permissions ADD CONSTRAINT permissions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE;
  
  
    insert into roles
      ("name", "description")
    values 
      ('viewer', 'Used as viewer/reader. Accounts have this role can make request only to display data, not mutate.'),
      ('developer', 'Accounts have this role can make all requests without limits.'),
      ('authorized', 'Accounts have this role can make request only with valid authorization credentials.');

    insert into privileges
      ("name", "description")
    values
      ('*', 'Unlimited access');

    insert into permissions
      ("role", "privilege")
    values
      ('developer', '*');
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