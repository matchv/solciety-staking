

const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'http://localhost:9200'
})

var indexname = "pool"

var payload = {
    "index": indexname,
    "body": {
        "settings": {
            "analysis": {
                "normalizer": {
                    "my_normalizer": {
                        "type": "custom",
                        "filter": ["lowercase"]
                    }
                },
                "analyzer": {
                    "my_analyzer": {
                        "tokenizer": "my_tokenizer",
                        "filter": [
                          "lowercase"
                        ]
                    },
                    "autocomplete_search": {
                      "tokenizer": "lowercase"
                    }
                },
                "tokenizer": {
                    "my_tokenizer": {
                        "type": "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 10,
                        "token_chars": [
                            "letter",
                            "digit",
                            "symbol"
                        ]
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "name": {
                    "type": "text",
                    "analyzer": "my_analyzer",
                    "search_analyzer": "autocomplete_search",
                    "fields": {
                        "normalize": {
                            "type": "keyword",
                            "normalizer": "my_normalizer"
                        },
                        "keyword": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                }
            }
        }
    }
}

client.indices.create(payload, function (error, response) {
    console.log(response);
});


