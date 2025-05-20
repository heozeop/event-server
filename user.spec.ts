expect(response.status).toBe(200);
expect(response.body).toHaveProperty("items");
expect(Array.isArray(response.body.items)).toBe(true);
// The API returns nextCursor instead of totalItems
expect(response.body).toHaveProperty("nextCursor");
expect(response.body).toHaveProperty("hasMore");
