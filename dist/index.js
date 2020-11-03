/*!
 * 
 *  Via Profit services / Accounts
 * 
 * Repository git@github.com:via-profit-services/accounts.git
 * Contact    https://via-profit.ru
 *       
 */
module.exports=function(e){var n={};function t(i){if(n[i])return n[i].exports;var a=n[i]={i:i,l:!1,exports:{}};return e[i].call(a.exports,a,a.exports,t),a.l=!0,a.exports}return t.m=e,t.c=n,t.d=function(e,n,i){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:i})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(t.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var a in e)t.d(i,a,function(n){return e[n]}.bind(null,a));return i},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=5)}([function(e,n){e.exports=require("@via-profit-services/core")},function(e,n,t){"use strict";var i=this&&this.__awaiter||function(e,n,t,i){return new(t||(t=Promise))((function(a,d){function u(e){try{r(i.next(e))}catch(e){d(e)}}function o(e){try{r(i.throw(e))}catch(e){d(e)}}function r(e){var n;e.done?a(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(u,o)}r((i=i.apply(e,n||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const d=t(0),u=a(t(2)),o={accounts:null};n.default=function(e){if(null!==o.accounts)return o;const n=new u.default({context:e});return o.accounts=new d.DataLoader(e=>i(this,void 0,void 0,(function*(){const t=yield n.getAccountsByIds(e);return d.collateForDataloader(e,t)}))),o}},function(e,n,t){"use strict";var i=this&&this.__awaiter||function(e,n,t,i){return new(t||(t=Promise))((function(a,d){function u(e){try{r(i.next(e))}catch(e){d(e)}}function o(e){try{r(i.throw(e))}catch(e){d(e)}}function r(e){var n;e.done?a(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(u,o)}r((i=i.apply(e,n||[])).next())}))},a=this&&this.__rest||function(e,n){var t={};for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&n.indexOf(i)<0&&(t[i]=e[i]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var a=0;for(i=Object.getOwnPropertySymbols(e);a<i.length;a++)n.indexOf(i[a])<0&&Object.prototype.propertyIsEnumerable.call(e,i[a])&&(t[i[a]]=e[i[a]])}return t},d=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const u=t(0),o=t(4),r=d(t(8)),c=t(9),l=t(3);n.default=class{constructor(e){this.props=e}static getDefaultAccountData(){return{id:c.v4(),name:"Unnamed",login:c.v4(),password:c.v4(),status:l.AccountStatus.allowed,roles:[],createdAt:r.default().format(),updatedAt:r.default().format()}}prepareDataToInsert(e){const{timezone:n}=this.props.context,t=Object.assign(Object.assign({},e),{updatedAt:r.default.tz(n).format()});return t.roles&&(t.roles=JSON.stringify(t.roles)),t}getAccounts(e){return i(this,void 0,void 0,(function*(){const{context:n}=this.props,{knex:t}=n,{limit:d,offset:r,orderBy:c,where:l,search:s}=e,p=yield t.select(["accounts.*",t.raw('count(*) over() as "totalCount"')]).from("accounts").orderBy(u.convertOrderByToKnex(c)).where(e=>u.convertWhereToKnex(e,l)).where(e=>(s&&s.forEach(({field:n,query:t})=>{t.split(" ").map(t=>e.orWhereRaw(`"${n}"::text ${u.TWhereAction.ILIKE} '%${t}%'`))}),e)).limit(d).offset(r).then(e=>i(this,void 0,void 0,(function*(){const t=new o.FileStorage({context:n}),i=yield t.getFiles({limit:100*e.length,where:[["owner",u.TWhereAction.IN,u.extractNodeIds(e)]],orderBy:[{field:"createdAt",direction:u.IDirectionRange.ASC}]});return{totalCount:e.length?Number(e[0].totalCount):0,nodes:e.map(e=>{var{totalCount:n}=e,t=a(e,["totalCount"]);const d=i.nodes.filter(e=>e.owner===t.id)||null,o=d.find(e=>"avatar"===e.category)||null;return Object.assign(Object.assign({},t),{files:d?u.arrayOfIdsToArrayOfObjectIds(d.map(e=>e.id)):null,avatar:o?{id:o.id}:null})})}}))),{totalCount:m,nodes:k}=p;return{totalCount:m,nodes:k,where:l,orderBy:c,limit:d,offset:r}}))}getAccountsByIds(e){return i(this,void 0,void 0,(function*(){const{nodes:n}=yield this.getAccounts({where:[["id",u.TWhereAction.IN,e]],offset:0,limit:e.length});return n}))}getAccount(e){return i(this,void 0,void 0,(function*(){const n=yield this.getAccountsByIds([e]);return!!n.length&&n[0]}))}getAccountByLogin(e){return i(this,void 0,void 0,(function*(){const{nodes:n}=yield this.getAccounts({limit:1,offset:0,where:[["login",u.TWhereAction.EQ,e]]});return!!n.length&&n[0]}))}updateAccount(e,n){return i(this,void 0,void 0,(function*(){const{knex:t,timezone:i}=this.props.context,a=this.prepareDataToInsert(Object.assign(Object.assign({},n),{updatedAt:r.default.tz(i).format()}));a.password&&(a.password=u.AuthService.cryptUserPassword(a.password)),yield t("accounts").update(a).where("id",e).returning("id")}))}createAccount(e){return i(this,void 0,void 0,(function*(){const{knex:n,timezone:t}=this.props.context,i=r.default.tz(t).format(),a=this.prepareDataToInsert(Object.assign(Object.assign({},e),{id:e.id?e.id:c.v4(),password:u.AuthService.cryptUserPassword(e.password),createdAt:i,updatedAt:i}));return(yield n("accounts").insert(a).returning("id"))[0]}))}deleteAccount(e){return i(this,void 0,void 0,(function*(){return this.updateAccount(e,{login:c.v4(),password:c.v4(),deleted:!0,status:l.AccountStatus.forbidden})}))}checkLoginExists(e,n){return i(this,void 0,void 0,(function*(){const{context:t}=this.props,{knex:i}=t;return!!(yield i("accounts").select("id").where("login",u.TWhereAction.EQ,e).whereNot("id",n)).length}))}}},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),function(e){e.allowed="allowed",e.forbidden="forbidden"}(n.AccountStatus||(n.AccountStatus={})),function(e){e.ACCOUNT_UPDATED="account-updated",e.ACCOUNT_DELETED="account-deleted"}(n.SubscriptionTriggers||(n.SubscriptionTriggers={}))},function(e,n){e.exports=require("@via-profit-services/file-storage")},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),function(e){for(var t in e)n.hasOwnProperty(t)||(n[t]=e[t])}(t(6))},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),function(e){for(var t in e)n.hasOwnProperty(t)||(n[t]=e[t])}(t(7))},function(e,n,t){"use strict";var i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}},a=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var n={};if(null!=e)for(var t in e)Object.hasOwnProperty.call(e,t)&&(n[t]=e[t]);return n.default=e,n};Object.defineProperty(n,"__esModule",{value:!0});const d=i(t(1));n.loaders=d.default;const u=i(t(10));n.resolvers=u.default;const o=a(t(16));n.typeDefs=o;const r=i(t(2));n.Accounts=r.default},function(e,n){e.exports=require("moment-timezone")},function(e,n){e.exports=require("uuid")},function(e,n,t){"use strict";var i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const a=i(t(11)),d=i(t(12)),u=i(t(13)),o={Query:{accounts:()=>({})},Mutation:{accounts:()=>({})},Subscription:i(t(15)).default,AccountsQuery:u.default,AccountsMutation:d.default,Account:a.default};n.default=o},function(e,n,t){"use strict";var i=this&&this.__awaiter||function(e,n,t,i){return new(t||(t=Promise))((function(a,d){function u(e){try{r(i.next(e))}catch(e){d(e)}}function o(e){try{r(i.throw(e))}catch(e){d(e)}}function r(e){var n;e.done?a(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(u,o)}r((i=i.apply(e,n||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const d=a(t(1)),u=new Proxy({id:()=>({}),avatar:()=>({}),files:()=>({}),createdAt:()=>({}),updatedAt:()=>({}),status:()=>({}),name:()=>({}),login:()=>({}),password:()=>({}),roles:()=>({}),deleted:()=>({})},{get:(e,n)=>(e,t,a)=>i(void 0,void 0,void 0,(function*(){const{id:i}=e,u=d.default(a),o=yield u.accounts.load(i);return"avatar"===n&&o.avatar?Object.assign(Object.assign({},o.avatar),{transform:t.transform||null}):o[n]}))});n.default=u},function(e,n,t){"use strict";var i=this&&this.__awaiter||function(e,n,t,i){return new(t||(t=Promise))((function(a,d){function u(e){try{r(i.next(e))}catch(e){d(e)}}function o(e){try{r(i.throw(e))}catch(e){d(e)}}function r(e){var n;e.done?a(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(u,o)}r((i=i.apply(e,n||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const d=t(0),u=t(4),o=a(t(1)),r=a(t(2)),c=t(3),l={update:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const{id:e,input:i}=n,{logger:a,pubsub:u}=t,l=o.default(t),s=new r.default({context:t});try{yield s.updateAccount(e,i)}catch(n){throw new d.ServerError("Failed to update account",{input:i,id:e})}if(i.status===c.AccountStatus.forbidden)try{new d.AuthService({context:t}).revokeAccountTokens(e)}catch(n){throw a.server.error("Failed to revoke account tokens",{err:n,id:e}),new d.ServerError("Failed to revoke account tokens",{err:n})}l.accounts.clear(e);const p=yield l.accounts.load(e);return u.publish(c.SubscriptionTriggers.ACCOUNT_UPDATED,{accountWasUpdated:p}),{id:e}})),create:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const{input:e}=n,i=new r.default({context:t});if(yield i.getAccountByLogin(e.login))throw new d.BadRequestError(`Account with login ${e.login} already exists`,{input:e});try{return{id:yield i.createAccount(e)}}catch(n){throw new d.ServerError("Failed to create account",{input:e})}})),delete:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const{id:e}=n,{logger:i,pubsub:a,token:l}=t,s=new r.default({context:t}),p=o.default(t),m=new u.FileStorage({context:t}),k=new d.AuthService({context:t});i.server.debug(`Delete account ${e} request`,{initiator:l.uuid});try{i.server.debug(`Delete account ${e} files request`,{initiator:l.uuid}),m.deleteFilesByOwner(e)}catch(n){throw i.server.error("Failed to delete account files",{err:n,id:e}),new d.ServerError("Failed to delete account files",{err:n})}try{i.server.debug(`Revoke account ${e} tokens request`,{initiator:l.uuid}),k.revokeAccountTokens(e)}catch(n){throw i.server.error("Failed to revoke account tokens",{err:n,id:e}),new d.ServerError("Failed to revoke account tokens",{err:n})}try{return yield s.deleteAccount(e),p.accounts.clear(e),a.publish(c.SubscriptionTriggers.ACCOUNT_DELETED,{accountWasDeleted:[e]}),!0}catch(n){throw new d.ServerError(`Failed to delete account with id ${e}`,{id:e})}}))};n.default=l},function(e,n,t){"use strict";var i=this&&this.__awaiter||function(e,n,t,i){return new(t||(t=Promise))((function(a,d){function u(e){try{r(i.next(e))}catch(e){d(e)}}function o(e){try{r(i.throw(e))}catch(e){d(e)}}function r(e){var n;e.done?a(e.value):(n=e.value,n instanceof t?n:new t((function(e){e(n)}))).then(u,o)}r((i=i.apply(e,n||[])).next())}))},a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(n,"__esModule",{value:!0});const d=t(0),u=t(14),o=a(t(1)),r=a(t(2)),c=t(3);n.accountsQueryResolver={list:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const e=o.default(t),i=d.buildQueryFilter(n),a=new r.default({context:t});try{i.where.push(["deleted",d.TWhereAction.EQ,!1]);const n=yield a.getAccounts(i),t=d.buildCursorConnection(n,"accounts");return n.nodes.forEach(n=>{e.accounts.clear(n.id).prime(n.id,n)}),t}catch(e){throw new d.ServerError("Failed to get Accounts list",{err:e})}})),statusesList:()=>Object.values(c.AccountStatus),rolesList:()=>u.ROLES_LIST,me:(e,n,t)=>i(void 0,void 0,void 0,(function*(){if(""===t.token.uuid)throw new d.UnauthorizedError("Unknown account");const e=o.default(t);return yield e.accounts.load(t.token.uuid)})),account:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const{id:e}=n,i=o.default(t);return yield i.accounts.load(e)})),checkLoginExists:(e,n,t)=>i(void 0,void 0,void 0,(function*(){const{login:e,skipId:i}=n,a=new r.default({context:t});return yield a.checkLoginExists(e,i)}))},n.default=n.accountsQueryResolver},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ROLES_LIST=["admin","driver","operator"]},function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});const i=t(0),a=t(3),d={accountWasUpdated:{subscribe:i.withFilter((e,n,t)=>t.pubsub.asyncIterator(a.SubscriptionTriggers.ACCOUNT_UPDATED),(e,n)=>e.accountWasUpdated.id===n.id)},accountWasDeleted:{subscribe:(e,n,t)=>t.pubsub.asyncIterator(a.SubscriptionTriggers.ACCOUNT_DELETED)}};n.default=d},function(e,n){var t={kind:"Document",definitions:[{kind:"ObjectTypeExtension",name:{kind:"Name",value:"Query"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"accounts"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountsQuery"}}},directives:[]}]},{kind:"ObjectTypeExtension",name:{kind:"Name",value:"Mutation"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"accounts"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountsMutation"}}},directives:[]}]},{kind:"ObjectTypeExtension",name:{kind:"Name",value:"Subscription"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",description:{kind:"StringValue",value:"Called when the account with following id was updated",block:!0},name:{kind:"Name",value:"accountWasUpdated"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Account"}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Called when the any account was deleted",block:!0},name:{kind:"Name",value:"accountWasDeleted"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}}}},directives:[]}]},{kind:"EnumTypeDefinition",name:{kind:"Name",value:"AccountStatus"},directives:[],values:[{kind:"EnumValueDefinition",name:{kind:"Name",value:"allowed"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"forbidden"},directives:[]}]},{kind:"EnumTypeDefinition",name:{kind:"Name",value:"AccountOrderField"},directives:[],values:[{kind:"EnumValueDefinition",name:{kind:"Name",value:"name"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"login"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"createdAt"},directives:[]},{kind:"EnumValueDefinition",name:{kind:"Name",value:"updatedAt"},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"Account edge bundle",block:!0},name:{kind:"Name",value:"AccountsEdge"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Edge"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"node"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Account"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"cursor"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"Accounts module queries",block:!0},name:{kind:"Name",value:"AccountsQuery"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",description:{kind:"StringValue",value:"Returns Accounts list bundle",block:!0},name:{kind:"Name",value:"list"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"first"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"offset"},type:{kind:"NamedType",name:{kind:"Name",value:"Int"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"after"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"orderBy"},type:{kind:"ListType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountOrderBy"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"filter"},type:{kind:"NamedType",name:{kind:"Name",value:"AccountListFilter"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"search"},type:{kind:"NamedType",name:{kind:"Name",value:"AccountFilterSearch"}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountListConnection"}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Returns Account statuses list",block:!0},name:{kind:"Name",value:"statusesList"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountStatus"}}}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"rolesList"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Returns Your account data",block:!0},name:{kind:"Name",value:"me"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Account"}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Returns account by ID",block:!0},name:{kind:"Name",value:"account"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]}],type:{kind:"NamedType",name:{kind:"Name",value:"Account"}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"checkLoginExists"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"login"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"skipId"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Boolean"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Possible data to filter list of accounts",block:!0},name:{kind:"Name",value:"AccountListFilter"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"status"},type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountStatus"}}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Account search filter",block:!0},name:{kind:"Name",value:"AccountFilterSearch"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"fields"},type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountFilterSearchField"}}}}},directives:[]},{kind:"InputValueDefinition",description:{kind:"StringValue",value:"Search query string",block:!0},name:{kind:"Name",value:"query"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]}]},{kind:"EnumTypeDefinition",description:{kind:"StringValue",value:"Possible fields to search accounts",block:!0},name:{kind:"Name",value:"AccountFilterSearchField"},directives:[],values:[{kind:"EnumValueDefinition",name:{kind:"Name",value:"name"},directives:[]}]},{kind:"ObjectTypeDefinition",name:{kind:"Name",value:"AccountsMutation"},interfaces:[],directives:[],fields:[{kind:"FieldDefinition",description:{kind:"StringValue",value:"Update existings account",block:!0},name:{kind:"Name",value:"update"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"input"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"InputAccountUpdateData"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Account"}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Create new Account",block:!0},name:{kind:"Name",value:"create"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"input"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"InputAccountCreateData"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Account"}}},directives:[]},{kind:"FieldDefinition",description:{kind:"StringValue",value:"Delete account",block:!0},name:{kind:"Name",value:"delete"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]}],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Boolean"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Ordering options for accounts returned from the connection",block:!0},name:{kind:"Name",value:"AccountOrderBy"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"field"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountOrderField"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"direction"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"OrderDirection"}}},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"Account data",block:!0},name:{kind:"Name",value:"Account"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Node"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"id"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"ID"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"avatar"},arguments:[{kind:"InputValueDefinition",name:{kind:"Name",value:"transform"},type:{kind:"NamedType",name:{kind:"Name",value:"ImageTransformInput"}},directives:[]}],type:{kind:"NamedType",name:{kind:"Name",value:"File"}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"files"},arguments:[],type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"File"}}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"name"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"login"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"password"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"status"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountStatus"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"createdAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"updatedAt"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"DateTime"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"roles"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"deleted"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Boolean"}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Possible data to driver update",block:!0},name:{kind:"Name",value:"InputAccountUpdateData"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"name"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"login"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"password"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"status"},type:{kind:"NamedType",name:{kind:"Name",value:"AccountStatus"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"roles"},type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}}},directives:[]}]},{kind:"InputObjectTypeDefinition",description:{kind:"StringValue",value:"Possible data to create new account",block:!0},name:{kind:"Name",value:"InputAccountCreateData"},directives:[],fields:[{kind:"InputValueDefinition",name:{kind:"Name",value:"id"},type:{kind:"NamedType",name:{kind:"Name",value:"String"}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"name"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"login"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"password"},type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}},directives:[]},{kind:"InputValueDefinition",name:{kind:"Name",value:"roles"},type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"String"}}}}},directives:[]}]},{kind:"ObjectTypeDefinition",description:{kind:"StringValue",value:"Accounts list bundle",block:!0},name:{kind:"Name",value:"AccountListConnection"},interfaces:[{kind:"NamedType",name:{kind:"Name",value:"Connection"}}],directives:[],fields:[{kind:"FieldDefinition",name:{kind:"Name",value:"totalCount"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"Int"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"pageInfo"},arguments:[],type:{kind:"NonNullType",type:{kind:"NamedType",name:{kind:"Name",value:"PageInfo"}}},directives:[]},{kind:"FieldDefinition",name:{kind:"Name",value:"edges"},arguments:[],type:{kind:"NonNullType",type:{kind:"ListType",type:{kind:"NamedType",name:{kind:"Name",value:"AccountsEdge"}}}},directives:[]}]}],loc:{start:0,end:2708}};t.loc.source={body:'extend type Query {\n  accounts: AccountsQuery!\n}\n\nextend type Mutation {\n  accounts: AccountsMutation!\n}\n\nextend type Subscription {\n\n  """\n  Called when the account with following id was updated\n  """\n  accountWasUpdated (id: ID!): Account!\n\n  """\n  Called when the any account was deleted\n  """\n  accountWasDeleted: [ID!]!\n}\n\nenum AccountStatus {\n  allowed\n  forbidden\n}\n\nenum AccountOrderField {\n  name\n  login\n  createdAt\n  updatedAt\n}\n\n\n\n"""\nAccount edge bundle\n"""\ntype AccountsEdge implements Edge {\n  node: Account!\n  cursor: String!\n}\n\n"""\nAccounts module queries\n"""\ntype AccountsQuery {\n\n  """\n  Returns Accounts list bundle\n  """\n  list(\n    first: Int\n    offset: Int\n    after: String\n    orderBy: [AccountOrderBy]\n    filter: AccountListFilter\n    search: AccountFilterSearch\n  ): AccountListConnection!\n\n  """\n  Returns Account statuses list\n  """\n  statusesList: [AccountStatus!]!\n  rolesList: [String!]!\n\n  """\n  Returns Your account data\n  """\n  me: Account!\n\n\n  """\n  Returns account by ID\n  """\n  account(id: ID!): Account\n\n  checkLoginExists(\n    login: String\n    skipId: ID!\n  ): Boolean!\n}\n\n\n"""\nPossible data to filter list of accounts\n"""\ninput AccountListFilter {\n  status: [AccountStatus!]\n}\n\n\n\n"""\nAccount search filter\n"""\ninput AccountFilterSearch {\n\n  fields: [AccountFilterSearchField!]!\n\n  """\n  Search query string\n  """\n  query: String!\n}\n\n"""\nPossible fields to search accounts\n"""\nenum AccountFilterSearchField {\n  name\n}\n\n\n\n\ntype AccountsMutation {\n  \n  """\n  Update existings account\n  """\n  update(\n    id: ID!\n    input: InputAccountUpdateData!\n  ): Account!\n\n  """\n  Create new Account\n  """\n  create(\n    input: InputAccountCreateData!\n  ): Account!\n\n  """\n  Delete account\n  """\n  delete(\n    id: ID!\n  ): Boolean!\n\n\n}\n\n\n\n\n"""\nOrdering options for accounts returned from the connection\n"""\ninput AccountOrderBy {\n  field: AccountOrderField!\n  direction: OrderDirection!\n}\n\n\n"""\nAccount data\n"""\ntype Account implements Node {\n  id: ID!\n  avatar(transform: ImageTransformInput): File\n  files: [File!]\n  name: String!\n  login: String!\n  password: String!\n  status: AccountStatus!\n  createdAt: DateTime!\n  updatedAt: DateTime!\n  roles: [String!]!\n  deleted: Boolean!\n}\n\n\n\n"""\nPossible data to driver update\n"""\ninput InputAccountUpdateData {\n  id: String\n  name: String\n  login: String\n  password: String\n  status: AccountStatus\n  roles: [String!]\n}\n\n"""\nPossible data to create new account\n"""\ninput InputAccountCreateData {\n  id: String\n  name: String!\n  login: String!\n  password: String!\n  roles: [String!]!\n}\n\n\n\n"""\nAccounts list bundle\n"""\ntype AccountListConnection implements Connection {\n  totalCount: Int!\n  pageInfo: PageInfo!\n  edges: [AccountsEdge]!\n}\n',name:"GraphQL request",locationOffset:{line:1,column:1}};e.exports=t}]);