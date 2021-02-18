module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 909:
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

    -- create types table
    drop table if exists "accountsTypes" cascade;
    create table "accountsTypes" (
      "type" varchar(100) not null,
      CONSTRAINT "accountTypes_un" UNIQUE ("type")
    );

    insert into "accountsTypes"
      ("type")
    values
      ('User')
    on conflict ("type") do nothing;



    -- add column entity
    alter table "accounts" add column "entity" uuid default null;
    alter table "accounts" alter column "type" type varchar(50) using "type"::varchar;
    alter table "accounts" alter column "type" set default 'User';
    update "accounts" set "type" = 'User';

    alter table "accounts" add constraint "accounts_type_fk" foreign key ("type") references "accountsTypes"("type") on delete cascade;

    -- delete type
    drop type if exists "accountType";


    -- set unique login
    alter table "accounts" add constraint "accounts_login_un" unique ("login");

    -- link accounts and users
    update
      "accounts"
    set
      "type" = 'User',
      "entity" = (
        select id from users where "name" ='Developer' or "comment" ilike 'Development account%'
      )
    where id = '40491ee1-a365-454f-b3ec-8a325ccfc371';

    delete from "accounts" where "entity" is null;
    
    alter table "accounts" alter column "entity" set not null;

  `);
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        return knex.raw(`

    update "accounts"
      set
    "entity" = null
    where id = '40491ee1-a365-454f-b3ec-8a325ccfc371';


    alter table "accounts" drop constraint "accounts_type_fk";
    alter table "accounts" alter column "type" drop default;
    alter table "accounts" drop column "entity" cascade;
    create type "accountType" as enum (
      'stuff',
      'client'
    );
    alter table "accounts" alter column "type" type "accountType" using 'stuff'::"accountType";
    alter table "accounts" alter column "type" set default 'stuff'::"accountType";
    alter table "accounts" drop constraint "accounts_login_un";
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
/******/ 	return __webpack_require__(909);
/******/ })()
;