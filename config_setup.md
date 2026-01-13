# Recording API Setup Instructions

## 1. Hostinger MySQL Setup

### Create Database:
1. Login to Hostinger control panel
2. Go to "Databases" → "MySQL Databases"
3. Create new database: `radio_recordings`
4. Create new user with full permissions
5. Note down: database name, username, password

### Run SQL Setup:
1. Open phpMyAdmin or MySQL interface
2. Select your `radio_recordings` database
3. Run the SQL from `database_setup.sql`

## 2. PHP API Configuration

### Update `public/api/recording_api.php`:

Replace these values in the `$config` array:

```php
$config = [
    'db_host' => 'localhost',                    // Usually localhost on Hostinger
    'db_name' => 'your_actual_db_name',         // Your MySQL database name
    'db_user' => 'your_actual_username',        // Your MySQL username  
    'db_pass' => 'your_actual_password',        // Your MySQL password
    'upload_dir' => '../recordings/',           // Keep as is
    'max_file_size' => 500 * 1024 * 1024,     // 500MB - adjust if needed
    'supabase_url' => 'https://your-project-id.supabase.co',  // Your Supabase URL
    'supabase_anon_key' => 'your_supabase_anon_key'           // Your Supabase anon key
];
```

### Get Supabase Values:
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy "Project URL" and "anon public" key

## 3. File Permissions

### Create recordings directory:
```bash
mkdir public/recordings
chmod 755 public/recordings
```

### Set PHP file permissions:
```bash
chmod 644 public/api/recording_api.php
```

## 4. Test the Setup

### Test database connection:
Create `test_db.php`:
```php
<?php
$pdo = new PDO("mysql:host=localhost;dbname=your_db_name", "username", "password");
echo "Database connected successfully!";
?>
```

### Test API endpoint:
Visit: `https://yourdomain.com/api/recording_api.php?action=list`
Should return: `{"success":true,"recordings":[],"count":0}`

## 5. Frontend Integration

### Add to your React Router:
```jsx
import RecordingsPage from "@/pages/RecordingsPage";

// Add to your routes
<Route path="/recordings" element={<RecordingsPage />} />
```

### Add navigation link:
```jsx
<Link to="/recordings">Recordings</Link>
```

## 6. Security Notes

### Production Security:
- Use environment variables for database credentials
- Add rate limiting to prevent abuse
- Implement proper CORS headers
- Add file type validation
- Set up regular backups

### File Security:
- Store recordings outside web root if possible
- Use .htaccess to protect direct file access
- Implement proper authentication checks

## 7. Troubleshooting

### Common Issues:

**Database Connection Failed:**
- Check MySQL credentials
- Verify database exists
- Check Hostinger MySQL host (might not be localhost)

**File Upload Errors:**
- Check PHP upload_max_filesize setting
- Verify directory permissions
- Check available disk space

**CORS Errors:**
- Add proper CORS headers in PHP
- Check if Hostinger blocks cross-origin requests

**Authentication Issues:**
- Verify Supabase URL and key
- Check JWT token format
- Ensure user is logged in

### Debug Mode:
Add to PHP config for debugging:
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

## 8. Monitoring & Maintenance

### Regular Tasks:
- Monitor disk space usage
- Clean up old recordings if needed
- Backup database regularly
- Check error logs

### Performance Optimization:
- Add database indexes for large datasets
- Implement file compression
- Use CDN for file delivery
- Add caching headers