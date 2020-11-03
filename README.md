# Via Profit services / Accounts

![via-profit-services-cover](./assets/via-profit-services-cover.png)

> Via Profit services / **Accounts** - это пакет, который является частью сервиса, базирующегося на `via-profit-services` и представляет собой реализацию схемы для работы с аккаунтами пользователей.

![npm (scoped)](https://img.shields.io/npm/v/@via-profit-services/accounts?color=blue)
![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/@via-profit-services/accounts?color=red)


## Содержание

- [Зависимости](#dependencies)
- [Установка и настройка](#setup)
- [Как использовать](#how-to-use)


## <a name="dependencies"></a> Зависимости

 - [Core](https://github.com/via-profit-services/core)
 - [File Storage](https://github.com/via-profit-services/file-storage)


## <a name="setup"></a> Установка и настройка

### Установка

```bash
yarn add ssh://git@github.com:via-profit-services/accounts.git#semver:^0.1.12
```

Список версий [см. здесь](https://github.com/via-profit-services/accounts/-/tags)

### Миграции

После первой установки примените все необходимые миграции:

```bash
yarn knex:migrate:latest
```

После применения миграций будут созданы все необходимые таблицы в вашей базе данных


## <a name="how-to-use"></a> Как использовать

Модуль экспортирует наружу:
 - typeDefs - Типы
 - resolvers - Резолверы
 - service - Класс, реализующий модель данного модуля

Для интеграции модуля, просто, задействуйте в своем приложении экспортируемые типы и резолверы

Пример использования:

```ts
import { App } from '@via-profit-services/core';
import { typeDefs, resolvers } from '@via-profit-services/accounts';

const app = new App({
  ...
  typeDefs,
  resolvers,
  ...
});
app.bootstrap();

```


## TODO

- [ ] Write the CONTRIBUTING docs
- [ ] Write the tests
- [ ] Create Subscriptions
