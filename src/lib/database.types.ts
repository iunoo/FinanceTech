export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          balance: number
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          balance: number
          color: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          balance?: number
          color?: string
          icon?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          transaction_id: string
          user_id: string
          type: string
          amount: number
          category: string
          description: string
          date: string
          wallet_id: string
          created_at: string
          is_transfer: boolean
          is_debt_transaction: boolean
          is_balance_adjustment: boolean
          linked_debt_id: string | null
          debt_transaction_type: string | null
          debt_type: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          user_id: string
          type: string
          amount: number
          category: string
          description: string
          date: string
          wallet_id: string
          created_at?: string
          is_transfer?: boolean
          is_debt_transaction?: boolean
          is_balance_adjustment?: boolean
          linked_debt_id?: string | null
          debt_transaction_type?: string | null
          debt_type?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          user_id?: string
          type?: string
          amount?: number
          category?: string
          description?: string
          date?: string
          wallet_id?: string
          created_at?: string
          is_transfer?: boolean
          is_debt_transaction?: boolean
          is_balance_adjustment?: boolean
          linked_debt_id?: string | null
          debt_transaction_type?: string | null
          debt_type?: string | null
        }
      }
      debts: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          remaining_amount: number
          due_date: string
          description: string
          type: string
          is_paid: boolean
          created_at: string
          original_wallet_id: string
          original_transaction_id: string | null
          payment_history: Json
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          remaining_amount: number
          due_date: string
          description: string
          type: string
          is_paid: boolean
          created_at?: string
          original_wallet_id: string
          original_transaction_id?: string | null
          payment_history?: Json
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          remaining_amount?: number
          due_date?: string
          description?: string
          type?: string
          is_paid?: boolean
          created_at?: string
          original_wallet_id?: string
          original_transaction_id?: string | null
          payment_history?: Json
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          color: string
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          color: string
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          color?: string
          is_default?: boolean
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          color_ranges: Json
          wallet_settings: Json
          notification_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          color_ranges?: Json
          wallet_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          color_ranges?: Json
          wallet_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}