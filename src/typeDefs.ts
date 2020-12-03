import gql from 'graphql-tag';

const schema = gql`

  extend type Query {
    accounts: AccountsQuery!
  }

  interface Profile {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    account: Account
    deleted: Boolean!
  }

  type Account implements Node {
    id: ID!
    login: String!
    password: String!
    status: AccountStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [String!]!
    deleted: Boolean!
  }

  enum AccountStatus {
    allowed
    forbidden
  }

  """
  Accounts module queries
  """
  type AccountsQuery {

    """
    Returns Your account data
    """
    me: Account!


    """
    Returns account by ID
    """
    account(id: ID!): Account
  }
`;

export default schema;
