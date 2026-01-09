import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnysfutwvxfxuvawbybb.supabase.co';
const supabaseKey = 'sb_publishable_pNm83vGb-m7jel8_UaqCbg_0FccAHYl';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContactForm() {
  console.log('Testing contact form submission...');
  
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Contact Form',
        message: 'This is a test message from the contact form.'
      }])
      .select();

    if (error) {
      console.error('Error submitting contact form:', error);
    } else {
      console.log('Contact form submitted successfully!', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testContactForm();