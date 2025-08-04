// Mock Supabase client for browser injection
(function() {
  'use strict';

  // Check if we're in a test environment
  const isTestEnvironment = window.location.hostname === 'localhost' && 
                           window.location.port === '3000' &&
                           (window.location.pathname.includes('/e2e') || 
                            window.location.search.includes('test=true'));

  if (!isTestEnvironment) {
    return; // Don't inject in production
  }

  // Mock data storage
  if (!window.mockData) {
    window.mockData = {
      fitness_cardio: [],
      fitness_workouts: [],
      fitness_sports: [],
      meals: [],
      food_items: [],
      receipts: [],
      calendar_events: [],
      planned_meals: [],
      profiles: []
    };
  }

  class MockSupabaseClient {
    constructor() {
      this.auth = {
        getSession: async () => ({
          data: {
            session: {
              user: {
                id: 'test-user-id-12345',
                email: 'test@example.com'
              }
            }
          },
          error: null
        }),
        signInWithPassword: async ({ email, password }) => ({
          data: {
            user: {
              id: 'test-user-id-12345',
              email: email
            },
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token'
            }
          },
          error: null
        })
      };

      this.from = (table) => new MockTable(table);
    }
  }

  class MockTable {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.selectFields = '*';
      this.insertData = null;
      this.updateData = null;
      this.deleteFlag = false;
      this.orderBy = null;
      this.limit = null;
    }

    select(fields = '*') {
      this.selectFields = fields;
      return this;
    }

    insert(data) {
      this.insertData = data;
      return this;
    }

    update(data) {
      this.updateData = data;
      return this;
    }

    delete() {
      this.deleteFlag = true;
      return this;
    }

    eq(field, value) {
      this.filters.push({ type: 'eq', field, value });
      return this;
    }

    in(field, values) {
      this.filters.push({ type: 'in', field, values });
      return this;
    }

    ilike(field, pattern) {
      this.filters.push({ type: 'ilike', field, pattern });
      return this;
    }

    order(field, direction = 'asc') {
      this.orderBy = { field, direction };
      return this;
    }

    limit(count) {
      this.limit = count;
      return this;
    }

    single() {
      return this;
    }

    async then(resolve) {
      const result = await this.execute();
      resolve(result);
      return result;
    }

    async execute() {
      const tableData = window.mockData[this.tableName] || [];

      // Handle INSERT
      if (this.insertData) {
        const newRecord = {
          id: `mock-${this.tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...this.insertData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        tableData.push(newRecord);
        window.mockData[this.tableName] = tableData;
        
        return {
          data: this.selectFields === '*' ? newRecord : this.selectFields === 'id' ? { id: newRecord.id } : newRecord,
          error: null
        };
      }

      // Handle UPDATE
      if (this.updateData) {
        const filteredData = this.applyFilters(tableData);
        if (filteredData.length > 0) {
          const updatedRecord = { ...filteredData[0], ...this.updateData, updated_at: new Date().toISOString() };
          const index = tableData.findIndex(item => item.id === filteredData[0].id);
          if (index !== -1) {
            tableData[index] = updatedRecord;
          }
          return {
            data: this.selectFields === '*' ? updatedRecord : this.selectFields === 'id' ? { id: updatedRecord.id } : updatedRecord,
            error: null
          };
        }
        return { data: null, error: null };
      }

      // Handle DELETE
      if (this.deleteFlag) {
        const filteredData = this.applyFilters(tableData);
        const idsToDelete = filteredData.map(item => item.id);
        window.mockData[this.tableName] = tableData.filter(item => !idsToDelete.includes(item.id));
        return { data: null, error: null };
      }

      // Handle SELECT
      let result = this.applyFilters(tableData);
      
      if (this.orderBy) {
        result.sort((a, b) => {
          const aVal = a[this.orderBy.field];
          const bVal = b[this.orderBy.field];
          if (this.orderBy.direction === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      if (this.limit) {
        result = result.slice(0, this.limit);
      }

      return {
        data: result,
        error: null
      };
    }

    applyFilters(data) {
      return data.filter(item => {
        return this.filters.every(filter => {
          switch (filter.type) {
            case 'eq':
              return item[filter.field] === filter.value;
            case 'in':
              return filter.values.includes(item[filter.field]);
            case 'ilike':
              const pattern = filter.pattern.replace(/%/g, '.*');
              const regex = new RegExp(pattern, 'i');
              return regex.test(item[filter.field]);
            default:
              return true;
          }
        });
      });
    }
  }

  // Create mock client
  const mockSupabase = new MockSupabaseClient();

  // Override window.supabase if it doesn't exist or if we're in test mode
  if (!window.supabase || window.location.search.includes('mock=true')) {
    window.supabase = mockSupabase;
    console.log('🔧 Injected mock Supabase client for testing');
  }

  // Add utility functions to window
  window.resetMockData = function() {
    window.mockData = {
      fitness_cardio: [],
      fitness_workouts: [],
      fitness_sports: [],
      meals: [],
      food_items: [],
      receipts: [],
      calendar_events: [],
      planned_meals: [],
      profiles: []
    };
  };

  window.getMockData = function() {
    return window.mockData || {};
  };

})(); 