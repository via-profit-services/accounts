/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/database/migrations/00000000000001_accounts-setup.ts":
/*!******************************************************************!*\
  !*** ./src/database/migrations/00000000000001_accounts-setup.ts ***!
  \******************************************************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: top-level-this-exports, __webpack_exports__ */
/*! CommonJS bailout: this is used directly at 8:17-21 */
/***/ (function(__unused_webpack_module, exports) {

eval("\n/**\n * @via-profit-services/core\n *\n * This migration file was created by the @via-profit-services/core package\n * This migration will create `accounts` table\n */\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.down = exports.up = void 0;\nfunction up(knex) {\n    return __awaiter(this, void 0, void 0, function* () {\n        return knex.raw(`\n\n    DROP TYPE IF EXISTS \"accountStatus\";\n    \n    CREATE TYPE \"accountStatus\" AS ENUM (\n      'allowed',\n      'forbidden'\n    );\n\n    DROP TYPE IF EXISTS \"accountType\";\n    CREATE TYPE \"accountType\" AS ENUM (\n      'stuff',\n      'client'\n    );\n\n    DROP TABLE IF EXISTS \"accounts\";\n    CREATE TABLE \"accounts\" (\n      \"id\" uuid NOT NULL,\n      \"name\" varchar(100) NOT NULL,\n      \"login\" varchar(100) NOT NULL,\n      \"password\" varchar(255) NOT NULL,\n      \"createdAt\" timestamptz NOT NULL DEFAULT now(),\n      \"updatedAt\" timestamptz NOT NULL DEFAULT now(),\n      \"status\" \"accountStatus\" NOT NULL DEFAULT 'allowed'::\"accountStatus\",\n      \"type\" \"accountType\" NOT NULL DEFAULT 'client'::\"accountType\",\n      \"roles\" jsonb NOT NULL DEFAULT '[]'::jsonb,\n      \"deleted\" boolean NOT NULL DEFAULT false,\n      \"comment\" text NULL,\n      CONSTRAINT accounts_pkey PRIMARY KEY (id)\n    );\n \n    CREATE INDEX \"accountsDeletedIndex\" ON accounts USING btree (deleted);\n\n  `);\n    });\n}\nexports.up = up;\nfunction down(knex) {\n    return __awaiter(this, void 0, void 0, function* () {\n        return knex.raw(`\n    DROP TABLE IF EXISTS \"accounts\" CASCADE;\n    DROP TYPE IF EXISTS \"accountStatus\" CASCADE;\n    DROP TYPE IF EXISTS \"accountType\" CASCADE;\n  `);\n    });\n}\nexports.down = down;\n\n\n//# sourceURL=webpack://@via-profit-services/accounts/./src/database/migrations/00000000000001_accounts-setup.ts?");

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
/******/ 	return __webpack_require__("./src/database/migrations/00000000000001_accounts-setup.ts");
/******/ })()
;