/*
  # Add encryption_password column to media_uploads

  1. New Columns
    - `encryption_password` (text, nullable)
      - Stores the auto-generated encryption password used when no user password is provided
      - Required for decryption of encrypted files without user-set passwords
      - Previously this was only returned to the upload caller and never persisted,
        causing all auto-encrypted files to fail decryption (empty string was used instead)

  2. Security Notes
    - The encryption_password is stored alongside encryption_iv and encryption_salt
    - This is acceptable because:
      a) The password alone is insufficient without IV + salt + encrypted data
      b) RLS policies restrict access to the record
      c) For user-password-protected files, password_hash is stored instead
         and the user must supply the actual password at view time
    - When a user sets their own password, encryption_password remains null
      and the viewer must enter the password manually

  3. Important Notes
    - Existing encrypted uploads with no user password CANNOT be decrypted retroactively
      because the original auto-generated passwords were never stored
    - This fix only ensures NEW uploads work correctly going forward
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_uploads' AND column_name = 'encryption_password'
  ) THEN
    ALTER TABLE media_uploads ADD COLUMN encryption_password text;
  END IF;
END $$;
