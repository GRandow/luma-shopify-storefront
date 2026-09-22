/**
 * GraphQL documents for the Customer Account API. Field names follow that
 * API's schema, which differs from the Storefront API's (e.g. `emailAddress`
 * and `phoneNumber` are objects, addresses use `zip`/`province`).
 */

const ADDRESS_FRAGMENT = /* GraphQL */ `
  fragment CustomerAddressFields on CustomerAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    zip
    country
    phoneNumber
  }
`;

export const CUSTOMER_PROFILE_QUERY = /* GraphQL */ `
  ${ADDRESS_FRAGMENT}
  query CustomerProfile {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        ...CustomerAddressFields
      }
      addresses(first: 10) {
        nodes {
          ...CustomerAddressFields
        }
      }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = /* GraphQL */ `
  ${ADDRESS_FRAGMENT}
  query CustomerOrders($first: Int!, $after: String) {
    customer {
      orders(first: $first, after: $after, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          statusPageUrl
          totalPrice {
            amount
            currencyCode
          }
          shippingAddress {
            ...CustomerAddressFields
          }
          lineItems(first: 10) {
            nodes {
              id
              title
              variantTitle
              variantId
              quantity
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;
