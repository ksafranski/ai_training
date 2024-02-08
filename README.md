# AI Model Training

Introduction to AI model training using OpenAI and Pinecone.

This example demonstrates using Retrieval-Augmented Generation (RAG) to train a model using OpenAI and then using Pinecone to index and query the trained model. RAG works by using a retriever to find relevant documents and then a generator to generate a response. This is useful for training a model on a large dataset and then querying the model for specific information; augmenting OpenAI's GPT model with a custom dataset.

_Keep in mind that this is a simple example and does not go into detail on how to properly train a model. This is just a starting point for understanding how to use OpenAI and Pinecone together. Properly training a model requires a lot of data, ensuring the data is well formatted and relevant._

_Additionally, especially in the case of conversational and NLP retrieval, fine-tuning can be a tool to further improve the model's contextual representations, responses, and relevance to desired use-case and outcome._

## Installation

You'll need to first setup local enviornment variables for the [OpenAI API](https://platform.openai.com/docs/overview)
as well as the [Pinecone API](https://app.pinecone.io/) API Key.

```bash
export OPENAI_API_KEY=[OPENAI_API_KEY]
export PINECONE_API_KEY=[PINECONE_API_KEY]
```

Install the dependencies:

```bash
yarn
```

## Usage

### Training a model

To train a model you can use the `train` command:

```bash
yarn train <data-directory>
```

The `<data-directory>` is the directory containing the training data. The DataLoader currently supports
`txt`, `csv`, and `json` files. This can be expanded by editing the `DataLoader` class instantiation in
the `.src/trainModel.ts` file.

### Querying a model

To query a model you can use the `prompt` command:

```bash
yarn prompt <input>
```

The `<input>` is the question or statement you want to use to query the model.

## Example

The repo contains an `epub` file which contains the text content of an epub book by Les Stroud. To train with this content:

```bash
yarn train ./source_data
```

Once trained and the process exits, you can query the model:

```bash
yarn query "What are the 5 most critical aspects of surviving and emergency?"
```
