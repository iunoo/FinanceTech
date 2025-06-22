# API Documentation for FinanceTech

This document provides comprehensive documentation for all API endpoints available in the FinanceTech application.

## Base URL

All API endpoints are relative to:

```
/api
```

## Authentication

Most endpoints require authentication using a JWT token.

**Authentication Header:**

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All API endpoints return standard error responses:

```json
{
  "status": "error",
  "message": "Error message description",
  "errorCode": "ERROR_CODE"
}
```

## Endpoints

### Authentication

#### Register

- **URL:** `/auth/register`
- **Method:** `POST`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "telegramId": null
    }
  }
  ```

#### Login

- **URL:** `/auth/login`
- **Method:** `POST`
- **Authentication:** None
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "telegramId": "telegram_id"
    }
  }
  ```

#### Get User Profile

- **URL:** `/auth/profile`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "telegramId": "telegram_id",
    "notificationSettings": {
      "daily": true,
      "weekly": true,
      "monthly": true,
      "debtReminders": true
    }
  }
  ```

#### Update User Profile

- **URL:** `/auth/profile`
- **Method:** `PUT`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "telegramId": "telegram_id",
    "notificationSettings": {
      "daily": true,
      "weekly": false,
      "monthly": true,
      "debtReminders": true
    }
  }
  ```
- **Response:**
  ```json
  {
    "id": "user_id",
    "name": "Updated Name",
    "email": "updated@example.com",
    "telegramId": "telegram_id",
    "notificationSettings": {
      "daily": true,
      "weekly": false,
      "monthly": true,
      "debtReminders": true
    }
  }
  ```

### Transactions

#### Get All Transactions

- **URL:** `/transactions`
- **Method:** `GET`
- **Authentication:** Required
- **Query Parameters:**
  - `startDate` (optional): Filter by start date (ISO format)
  - `endDate` (optional): Filter by end date (ISO format)
  - `category` (optional): Filter by category
  - `type` (optional): Filter by transaction type ('income' or 'expense')
- **Response:**
  ```json
  [
    {
      "id": "transaction_id",
      "transactionId": "CO-2305001",
      "type": "expense",
      "amount": 50000,
      "category": "Makanan & Minuman",
      "description": "Makan siang",
      "date": "2023-05-15",
      "walletId": "wallet_id",
      "createdAt": "2023-05-15T12:30:45Z"
    }
  ]
  ```

#### Create Transaction

- **URL:** `/transactions`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "type": "expense",
    "amount": 50000,
    "category": "Makanan & Minuman",
    "description": "Makan siang",
    "date": "2023-05-15",
    "walletId": "wallet_id"
  }
  ```
- **Response:**
  ```json
  {
    "id": "transaction_id",
    "transactionId": "CO-2305001",
    "type": "expense",
    "amount": 50000,
    "category": "Makanan & Minuman",
    "description": "Makan siang",
    "date": "2023-05-15",
    "walletId": "wallet_id",
    "createdAt": "2023-05-15T12:30:45Z"
  }
  ```

#### Update Transaction

- **URL:** `/transactions/:id`
- **Method:** `PUT`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "amount": 55000,
    "category": "Makanan & Minuman",
    "description": "Makan siang dengan teman",
    "date": "2023-05-15",
    "walletId": "wallet_id"
  }
  ```
- **Response:**
  ```json
  {
    "id": "transaction_id",
    "transactionId": "CO-2305001",
    "type": "expense",
    "amount": 55000,
    "category": "Makanan & Minuman",
    "description": "Makan siang dengan teman",
    "date": "2023-05-15",
    "walletId": "wallet_id",
    "createdAt": "2023-05-15T12:30:45Z"
  }
  ```

#### Delete Transaction

- **URL:** `/transactions/:id`
- **Method:** `DELETE`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "message": "Transaction deleted successfully"
  }
  ```

#### Get Transaction Statistics

- **URL:** `/transactions/stats`
- **Method:** `GET`
- **Authentication:** Required
- **Query Parameters:**
  - `startDate` (optional): Filter by start date (ISO format)
  - `endDate` (optional): Filter by end date (ISO format)
- **Response:**
  ```json
  {
    "stats": [
      {
        "_id": "income",
        "total": 1500000,
        "count": 5
      },
      {
        "_id": "expense",
        "total": 750000,
        "count": 12
      }
    ],
    "categoryStats": [
      {
        "_id": "Makanan & Minuman",
        "total": 350000,
        "count": 7
      },
      {
        "_id": "Transportasi",
        "total": 150000,
        "count": 3
      }
    ]
  }
  ```

### Debts

#### Get All Debts

- **URL:** `/debts`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  [
    {
      "id": "debt_id",
      "name": "John Doe",
      "amount": 500000,
      "remainingAmount": 300000,
      "dueDate": "2023-06-15T00:00:00Z",
      "description": "Pinjaman untuk biaya kuliah",
      "type": "debt",
      "isPaid": false,
      "createdAt": "2023-05-15T12:30:45Z",
      "originalWalletId": "wallet_id",
      "paymentHistory": [
        {
          "id": "payment_id",
          "amount": 200000,
          "date": "2023-05-30",
          "walletId": "wallet_id",
          "method": "transfer",
          "notes": "Pembayaran pertama",
          "timestamp": "2023-05-30T14:20:10Z",
          "transactionId": "transaction_id"
        }
      ]
    }
  ]
  ```

#### Create Debt

- **URL:** `/debts`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "amount": 500000,
    "dueDate": "2023-06-15T00:00:00Z",
    "description": "Pinjaman untuk biaya kuliah",
    "type": "debt"
  }
  ```
- **Response:**
  ```json
  {
    "id": "debt_id",
    "name": "John Doe",
    "amount": 500000,
    "remainingAmount": 500000,
    "dueDate": "2023-06-15T00:00:00Z",
    "description": "Pinjaman untuk biaya kuliah",
    "type": "debt",
    "isPaid": false,
    "createdAt": "2023-05-15T12:30:45Z",
    "originalWalletId": "wallet_id",
    "paymentHistory": []
  }
  ```

#### Update Debt

- **URL:** `/debts/:id`
- **Method:** `PUT`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "name": "John Smith",
    "dueDate": "2023-07-15T00:00:00Z",
    "description": "Pinjaman untuk biaya kuliah semester 2"
  }
  ```
- **Response:**
  ```json
  {
    "id": "debt_id",
    "name": "John Smith",
    "amount": 500000,
    "remainingAmount": 300000,
    "dueDate": "2023-07-15T00:00:00Z",
    "description": "Pinjaman untuk biaya kuliah semester 2",
    "type": "debt",
    "isPaid": false,
    "createdAt": "2023-05-15T12:30:45Z",
    "originalWalletId": "wallet_id",
    "paymentHistory": [
      {
        "id": "payment_id",
        "amount": 200000,
        "date": "2023-05-30",
        "walletId": "wallet_id",
        "method": "transfer",
        "notes": "Pembayaran pertama",
        "timestamp": "2023-05-30T14:20:10Z",
        "transactionId": "transaction_id"
      }
    ]
  }
  ```

#### Delete Debt

- **URL:** `/debts/:id`
- **Method:** `DELETE`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "message": "Debt deleted successfully"
  }
  ```

#### Mark Debt as Paid

- **URL:** `/debts/:id/paid`
- **Method:** `PATCH`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "id": "debt_id",
    "name": "John Smith",
    "amount": 500000,
    "remainingAmount": 0,
    "dueDate": "2023-07-15T00:00:00Z",
    "description": "Pinjaman untuk biaya kuliah semester 2",
    "type": "debt",
    "isPaid": true,
    "createdAt": "2023-05-15T12:30:45Z",
    "originalWalletId": "wallet_id",
    "paymentHistory": [
      {
        "id": "payment_id",
        "amount": 500000,
        "date": "2023-06-10",
        "walletId": "wallet_id",
        "method": "transfer",
        "notes": "Pelunasan",
        "timestamp": "2023-06-10T09:15:30Z",
        "transactionId": "transaction_id"
      }
    ]
  }
  ```

#### Get Upcoming Debts

- **URL:** `/debts/upcoming`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  [
    {
      "id": "debt_id",
      "name": "John Smith",
      "amount": 500000,
      "remainingAmount": 500000,
      "dueDate": "2023-06-15T00:00:00Z",
      "description": "Pinjaman untuk biaya kuliah",
      "type": "debt",
      "isPaid": false,
      "createdAt": "2023-05-15T12:30:45Z"
    }
  ]
  ```

### Analysis

#### Generate Financial Analysis

- **URL:** `/analysis/generate`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "timeRange": "month"
  }
  ```
- **Response:**
  ```json
  {
    "analysis": "Detailed financial analysis text..."
  }
  ```

#### Check AI Service Status

- **URL:** `/analysis/status`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "status": "online",
    "message": "AI ChatGPT (GPT-4o Mini) aktif dan siap digunakan"
  }
  ```

### Telegram Integration

#### Test Telegram Connection

- **URL:** `/telegram/test`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "telegramId": "123456789"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Pesan uji coba berhasil dikirim ke Telegram!"
  }
  ```

#### Check Telegram Bot Status

- **URL:** `/telegram/status`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "status": "online",
    "message": "Bot Telegram aktif (@your_bot_username)"
  }
  ```

### Settings

#### Save API Keys

- **URL:** `/settings/api-keys`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "openaiKey": "sk-your-openai-key",
    "telegramToken": "your-telegram-bot-token"
  }
  ```
- **Response:**
  ```json
  {
    "message": "API Keys berhasil disimpan dan diterapkan!",
    "updated": {
      "openai": true,
      "telegram": true
    }
  }
  ```

#### Get API Key Status

- **URL:** `/settings/api-keys/status`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "openai": {
      "configured": true,
      "valid": true
    },
    "telegram": {
      "configured": true,
      "valid": true
    }
  }
  ```

#### Download Database Backup

- **URL:** `/settings/database/backup`
- **Method:** `GET`
- **Authentication:** Required
- **Response:** Binary file (application/gzip)

#### Restore Database from Backup

- **URL:** `/settings/database/restore`
- **Method:** `POST`
- **Authentication:** Required
- **Request Body:** Form data with `backupFile` field (file upload)
- **Response:**
  ```json
  {
    "message": "Database berhasil dipulihkan dari backup!",
    "tempBackup": "pre-restore-backup-2023-05-15.gz"
  }
  ```

#### Get Backup History

- **URL:** `/settings/database/backups`
- **Method:** `GET`
- **Authentication:** Required
- **Response:**
  ```json
  {
    "backups": [
      {
        "id": "backup-1621234567890",
        "filename": "financeapp-backup-2023-05-17.gz",
        "createdAt": "2023-05-17T10:15:30Z",
        "size": "10 MB",
        "type": "automatic"
      }
    ]
  }
  ```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `USER_EXISTS` | User with this email already exists |
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `FORBIDDEN` | User does not have permission for this action |
| `NOT_FOUND` | Requested resource not found |
| `VALIDATION_ERROR` | Request data validation failed |
| `INSUFFICIENT_BALANCE` | Wallet balance is insufficient for transaction |
| `INVALID_TELEGRAM_ID` | Telegram ID is invalid or bot not activated |
| `BOT_BLOCKED` | Telegram bot is blocked by the user |
| `INVALID_API_KEY` | API key is invalid or expired |
| `SERVER_ERROR` | Internal server error |

## Rate Limits

- Standard endpoints: 100 requests per 15 minutes
- Authentication endpoints: 20 login attempts per hour
- API endpoints: 300 requests per 5 minutes

## Versioning

Current API version: v1

All endpoints should be prefixed with `/api/v1` for future compatibility.