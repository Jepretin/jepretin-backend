const fs = require('fs');

const path = './src/docs/swagger.json';
const doc = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Tambah PaginatedResponse
doc.components.schemas.PaginatedResponse = {
  type: "object",
  properties: {
    total: { type: "integer" },
    page: { type: "integer" },
    limit: { type: "integer" },
    data: { type: "array", items: { type: "object" } }
  }
};

// 2. Tambah Provider Search
if (!doc.paths['/provider/search']) {
  doc.paths['/provider/search'] = {
    get: {
      tags: ["Provider"],
      summary: "Search providers",
      description: "Public (authenticated customer) search for providers by location, role, and keyword",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        { name: "keyword", in: "query", description: "Search by provider name", schema: { type: "string" } },
        { name: "districtId", in: "query", description: "Filter by coverage district", schema: { type: "string" } },
        { name: "roleId", in: "query", description: "Filter by provider role ID", schema: { type: "string", format: "uuid" } }
      ],
      responses: {
        200: {
          description: "Search results",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "integer" },
                  message: { type: "string" },
                  data: { $ref: "#/components/schemas/PaginatedResponse" }
                }
              }
            }
          }
        }
      }
    }
  };
}

// 3. Tambah User update-avatar
if (!doc.paths['/user/update-avatar']) {
  doc.paths['/user/update-avatar'] = {
    put: {
      tags: ["User"],
      summary: "Update user avatar",
      description: "Upload a new avatar image for the authenticated user",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                avatar: { type: "string", format: "binary" }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: "Avatar updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" }
            }
          }
        },
        400: { $ref: "#/components/responses/ValidationError" },
        401: { $ref: "#/components/responses/UnauthorizedError" }
      }
    }
  };
}

// 4. Update Pagination pada endpoint List
const listEndpoints = [
  { path: '/user/all-user', method: 'get' },
  { path: '/order/all-order', method: 'get' },
  { path: '/order/my-orders', method: 'get' },
  { path: '/order/provider-orders', method: 'get' },
  { path: '/provider/all-provider', method: 'get' },
  { path: '/provider/all-bundle', method: 'get' },
  { path: '/provider/my-bundle', method: 'get' },
  { path: '/provider/all-topping', method: 'get' },
  { path: '/provider/my-topping', method: 'get' },
  { path: '/provider/all-portofolio', method: 'get' },
  { path: '/provider/my-portofolio', method: 'get' },
  { path: '/provider/portofolio-by-location', method: 'get' },
  { path: '/payment/my-payment', method: 'get' },
  { path: '/withdrawal/my-requests', method: 'get' },
  { path: '/withdrawal/all-requests', method: 'get' },
  { path: '/review/my-reviews', method: 'get' },
  { path: '/review/provider-reviews', method: 'get' },
];

listEndpoints.forEach(({ path, method }) => {
  if (doc.paths[path] && doc.paths[path][method]) {
    const ep = doc.paths[path][method];
    // Add pagination query params
    if (!ep.parameters) ep.parameters = [];
    if (!ep.parameters.find(p => p.name === 'page')) {
      ep.parameters.push({ name: "page", in: "query", schema: { type: "integer", default: 1 } });
    }
    if (!ep.parameters.find(p => p.name === 'limit')) {
      ep.parameters.push({ name: "limit", in: "query", schema: { type: "integer", default: 20 } });
    }
    // Update response schema to PaginatedResponse
    if (ep.responses['200'] && ep.responses['200'].content && ep.responses['200'].content['application/json']) {
      ep.responses['200'].content['application/json'].schema = {
        type: "object",
        properties: {
          code: { type: "integer" },
          message: { type: "string" },
          data: { $ref: "#/components/schemas/PaginatedResponse" }
        }
      };
    }
  }
});

fs.writeFileSync(path, JSON.stringify(doc, null, 2));
console.log('Swagger updated successfully!');
