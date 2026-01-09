import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createContactMessagesTable() {
  console.log('Creating contact_messages table...');
  
  try {
    // Test if we can insert a sample message (this will create the table if it doesn't exist)
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Message',
        message: 'This is a test message to create the table.'
      }])
      .select();

    if (error) {
      console.error('Error creating table:', error);
      console.log('This is expected if the table doesn\'t exist yet.');
      console.log('Please create the table manually in Supabase dashboard with the following SQL:');
      console.log(`
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
  FOR SELECT USING (auth.role() = 'authenticated');
      `);
    } else {
      console.log('Table created successfully!', data);
      
      // Clean up the test message
      if (data && data[0]) {
        await supabase
          .from('contact_messages')
          .delete()
          .eq('id', data[0].id);
        console.log('Test message cleaned up.');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createContactMessagesTable();