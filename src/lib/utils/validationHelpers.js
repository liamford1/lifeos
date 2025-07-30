// Utility to map Zod errors to a { field: message } object
function mapZodErrors(error) {
  const errors = {};
  if (error && error.errors) {
    error.errors.forEach(err => {
      if (err.path && err.path[0]) {
        errors[err.path[0]] = err.message;
      }
    });
  }
  return errors;
}

module.exports = { mapZodErrors }; 