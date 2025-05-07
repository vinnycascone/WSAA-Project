# WSAA-Project

# Asset Manager: Vincenzo's Final Project

This project is a lightweight asset management platform designed with privacy and ease-of-use in mind. It allows users to quickly register using a randomly generated identifier, ensuring anonymity while they track their investments in various asset classes—be it stocks, cryptocurrencies, or fiat currencies. Users can log transactions such as buying stocks at a specified price, and later, the system will dynamically compare these against live market values via an external API. Initially built as a small, focused project to validate core functionalities, the design intentionally minimizes registration friction and data collection. This approach not only enhances user privacy but also accelerates adoption, while laying a scalable foundation for future expansion and feature enhancements.

## Table of Contents

* [Part A: Database Creation](#part-a-database-creation)
* [Why We Use Filess.io for Our Database Hosting](#why-we-use-filessio-for-our-database-hosting)
* [Part B: API Development](#part-b-api-development)
* [Utility Functions](#utility-functions)
* [Running API and Creating Sample Assets](#running-api-and-creating-sample-assets)
* [Testing the API](#testing-the-api)
* [Part C: Frontend Development](#part-c-frontend-development)
* [Initial Interface](#initial-interface)
* [Alpha Vantage API Integration](#alpha-vantage-api-integration)
* [Interface Improvements](#interface-improvements)

## Part A: Database Creation

The project utilizes a database to store user transactions and asset information.

### Why We Use Filess.io for Our Database Hosting

* **Simplified Management:** Filess.io provides a user-friendly interface and manages many of the routine database administration tasks (such as backups, scaling, and security) for you. This allows our team to focus on building the application and core functionalities rather than being bogged down by infrastructure management.
* **Scalability:** While our project is small right now, Filess.io’s cloud-based platform is built to scale. As we grow from a simple asset tracker to a larger system with more users and features, it’s easy to upgrade our resources without major disruptions.
* **High Availability:** Filess.io’s infrastructure is designed to be highly available, ensuring that our application’s data is accessible when needed. This reliability is crucial for any application dealing with financial information.
* **Security:** Filess.io offers robust security features, which are vital for protecting sensitive user data and financial transactions. Their security measures help us maintain compliance and safeguard our users’ privacy.
* **Cost-Effectiveness:** For a project of our current size, Filess.io provides a cost-effective solution. We only pay for the resources we use, which helps us manage our budget efficiently while enforcing data integrity through primary and foreign key constraints.

## Part B: API Development

The project includes an API to handle data operations and interact with external services.

### Utility Functions

The API incorporates utility functions to streamline operations, including:

* **Random User ID Generation:**

    ```javascript
    // Example of random User ID generation (Conceptual)
    function generateRandomUserId() {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let userId = '';
        for (let i = 0; i < 6; i++) {
            userId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return userId;
    }
    ```

    This function is a concise way to generate a random and anonymous user ID from a set of 36 characters, offering over 2 billion unique combinations (36⁶ possibilities). Although collisions (duplicate IDs) are extremely unlikely, the surrounding registration logic ensures that if a collision occurs, a new ID will be generated.

### Running API and Creating Sample Assets

The API was successfully run and debugged. Sample assets were created to test the system.

### Testing the API

Postman was used to test the API endpoints.

* Initial attempts encountered errors, but these were debugged and resolved.
* Successful GET requests were made to retrieve valid assets.
* Attempts to retrieve transactions for non-existent users resulted in appropriate error responses.
* Transactions were successfully created for users.

## Part C: Frontend Development

A user interface was developed to interact with the asset management platform.

### Initial Interface

* The initial HTML skeleton was created with CSS styling and an AJAX script.
* Functionality was implemented to create users, load assets, generate transactions, and load transactions.

### Alpha Vantage API Integration

* The Alpha Vantage API was integrated to retrieve real-time stock data. This allows the system to compare user-recorded transaction prices with current market values.

### Interface Improvements

* The user interface was enhanced with improved CSS styling.
* The dashboard design was refined, incorporating navigation tools and a sidebar for better user experience.
* JavaScript files were separated for better code organization and maintainability.

---

**Note:** This README is based on the information provided in the Word document. It may need to be further expanded or modified to include specific installation instructions, technologies used (e.g., programming languages, frameworks), and other project-specific details.



-------------------------

