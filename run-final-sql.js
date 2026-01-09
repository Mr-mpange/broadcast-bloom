import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.log('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFinalSQL() {
    console.log('🎯 RUNNING FINAL SQL SETUP');
    console.log('==================================================');
    
    try {
        // Read the SQL file
        const sqlContent = fs.readFileSync('final-manual-sql.sql', 'utf8');
        
        // Split into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`📝 Found ${statements.length} SQL statements to execute...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: statement
            });
            
            if (error) {
                console.log(`⚠️  Statement ${i + 1} result:`, error.message);
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`);
            }
        }
        
        console.log('\n🎯 FINAL VERIFICATION');
        console.log('==================================================');
        
        // Test contact_messages table
        const { data: contactTest, error: contactError } = await supabase
            .from('contact_messages')
            .select('*')
            .limit(1);
            
        if (contactError) {
            console.log('❌ contact_messages table:', contactError.message);
        } else {
            console.log('✅ contact_messages table working');
        }
        
        // Test audio_content table
        const { data: audioTest, error: audioError } = await supabase
            .from('audio_content')
            .select('*')
            .limit(1);
            
        if (audioError) {
            console.log('❌ audio_content table:', audioError.message);
        } else {
            console.log('✅ audio_content table working');
        }
        
        console.log('\n🎉 SETUP COMPLETE!');
        console.log('Now run: node complete-setup.js');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runFinalSQL();