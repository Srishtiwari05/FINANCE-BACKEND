import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Backend API',
      version: '1.0.0',
      description:
        'A REST API for finance data processing and access control. Supports user management with RBAC (viewer, analyst, admin), financial records CRUD, and dashboard analytics.',
      contact: { name: 'Finance Backend' },
    },
    servers: [{ url: `http://localhost:${env.port}/api/v1`, description: 'Local dev server' }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        FinancialEntry: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            createdBy: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
