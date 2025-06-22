/*
  # Initial Schema Setup for FinanceTech

  1. New Tables
    - `profiles` - User profile information
    - `wallets` - User wallets
    - `transactions` - Financial transactions
    - `debts` - Debt and credit records
    - `categories` - Transaction categories
    - `user_settings` - User preferences and settings
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  telegram_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#0066CC',
  icon TEXT NOT NULL DEFAULT '🏦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_transfer BOOLEAN DEFAULT FALSE,
  is_debt_transaction BOOLEAN DEFAULT FALSE,
  is_balance_adjustment BOOLEAN DEFAULT FALSE,
  linked_debt_id UUID,
  debt_transaction_type TEXT,
  debt_type TEXT
);

-- Create debts table
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  original_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  original_transaction_id UUID,
  payment_history JSONB DEFAULT '[]'::JSONB
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  color_ranges JSONB DEFAULT NULL,
  wallet_settings JSONB DEFAULT NULL,
  notification_settings JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for wallets
CREATE POLICY "Users can view their own wallets" 
  ON public.wallets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" 
  ON public.wallets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" 
  ON public.wallets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" 
  ON public.wallets FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
  ON public.transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
  ON public.transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for debts
CREATE POLICY "Users can view their own debts" 
  ON public.debts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts" 
  ON public.debts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts" 
  ON public.debts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts" 
  ON public.debts FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Users can view their own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for user settings
CREATE POLICY "Users can view their own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON public.user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS debts_due_date_idx ON public.debts(due_date);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);