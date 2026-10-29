const { z } = require('zod');
const { idParam, paginationQuery, searchQuery } = require('../../utils/commonSchemas');

const categoryBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

const listCategoriesSchema = z.object({
  query: z.object({ ...paginationQuery, search: searchQuery }),
});

const categoryIdSchema = z.object({ params: idParam });

const createCategorySchema = z.object({ body: categoryBody });

const updateCategorySchema = z.object({ params: idParam, body: categoryBody });

module.exports = { listCategoriesSchema, categoryIdSchema, createCategorySchema, updateCategorySchema };
