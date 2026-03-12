# HN Search Patterns

## Tag Combinations

Tags combine with AND logic. Use `(tag1,tag2)` for OR within groups.

### Content Types
- `story` — stories only
- `comment` — comments only
- `poll` — polls
- `job` — job postings
- `ask_hn` — Ask HN posts
- `show_hn` — Show HN posts

### Author Filter
- `author_USERNAME` — all posts by user

### Story Context
- `story_ID` — comments on specific story

## Numeric Filters

Use `numericFilters` parameter with operators: `<`, `>`, `<=`, `>=`, `=`

### Date Filtering
```bash
# Posts from last 24 hours
numericFilters=created_at_i>$(date -d '24 hours ago' +%s)

# Posts from last week
numericFilters=created_at_i>$(date -d '7 days ago' +%s)

# Posts in date range
numericFilters=created_at_i>1700000000,created_at_i<1701000000
```

### Score Filtering
```bash
# High-scoring posts
numericFilters=points>100

# Very popular
numericFilters=points>500

# Combine with date
numericFilters=points>100,created_at_i>1700000000
```

### Comment Count
```bash
# Highly discussed
numericFilters=num_comments>50
```

## Common Queries

### Who is Hiring Threads
```bash
curl "https://hn.algolia.com/api/v1/search?query=who%20is%20hiring&tags=story,author_whoishiring&hitsPerPage=12"
```

### Who Wants to be Hired
```bash
curl "https://hn.algolia.com/api/v1/search?query=who%20wants%20to%20be%20hired&tags=story,author_whoishiring"
```

### Freelancer Threads
```bash
curl "https://hn.algolia.com/api/v1/search?query=freelancer&tags=story,author_whoishiring"
```

### Top Posts This Month
```bash
MONTH_AGO=$(date -d '30 days ago' +%s)
curl "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>$MONTH_AGO,points>200"
```

### User's Top Posts
```bash
curl "https://hn.algolia.com/api/v1/search?tags=author_USERNAME,story&numericFilters=points>50"
```

### Comments Mentioning Term
```bash
curl "https://hn.algolia.com/api/v1/search?query=TERM&tags=comment"
```

### Front Page Items (Alternative)
```bash
curl "https://hn.algolia.com/api/v1/search?tags=front_page"
```

## Response Structure

```json
{
  "hits": [
    {
      "objectID": "12345",
      "title": "Story Title",
      "url": "https://example.com",
      "author": "username",
      "points": 150,
      "num_comments": 42,
      "created_at_i": 1234567890,
      "_tags": ["story", "author_username"]
    }
  ],
  "nbHits": 1000,
  "page": 0,
  "nbPages": 50,
  "hitsPerPage": 20
}
```
