# HN API Reference

## Official Firebase API

Base: `https://hacker-news.firebaseio.com/v0`

### Story Lists (return arrays of IDs)
```bash
# Top 500 stories
curl https://hacker-news.firebaseio.com/v0/topstories.json

# Newest 500
curl https://hacker-news.firebaseio.com/v0/newstories.json

# Best stories
curl https://hacker-news.firebaseio.com/v0/beststories.json

# Ask HN
curl https://hacker-news.firebaseio.com/v0/askstories.json

# Show HN
curl https://hacker-news.firebaseio.com/v0/showstories.json

# Jobs
curl https://hacker-news.firebaseio.com/v0/jobstories.json
```

### Single Item
```bash
curl https://hacker-news.firebaseio.com/v0/item/12345.json
```

Response:
```json
{
  "id": 12345,
  "type": "story",
  "by": "username",
  "time": 1234567890,
  "title": "Title here",
  "url": "https://example.com",
  "score": 150,
  "descendants": 42,
  "kids": [12346, 12347]
}
```

### User Profile
```bash
curl https://hacker-news.firebaseio.com/v0/user/pg.json
```

Response:
```json
{
  "id": "pg",
  "created": 1160418092,
  "karma": 157236,
  "about": "Bio here",
  "submitted": [1234, 5678]
}
```

## Algolia Search API

Base: `https://hn.algolia.com/api/v1`

### Search Stories
```bash
# Basic search
curl "https://hn.algolia.com/api/v1/search?query=rust"

# With filters
curl "https://hn.algolia.com/api/v1/search?query=rust&tags=story&numericFilters=points>100"
```

### Search by Date (sorted by date, not relevance)
```bash
curl "https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=created_at_i>1700000000"
```

### Pagination
```bash
curl "https://hn.algolia.com/api/v1/search?query=AI&page=2&hitsPerPage=50"
```

### Get Single Item
```bash
curl "https://hn.algolia.com/api/v1/items/12345"
```

### Get User
```bash
curl "https://hn.algolia.com/api/v1/users/pg"
```
