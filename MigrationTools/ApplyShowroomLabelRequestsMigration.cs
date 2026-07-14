using System;
using Npgsql;

class Program
{
    static void Main(string[] args)
    {
        var connectionString = "Host=localhost;Port=5432;Database=dms_erp_db;Username=postgres;Password=10158";
        
        Console.WriteLine("==================================================");
        Console.WriteLine("  Applying ShowroomLabelRequests Migration");
        Console.WriteLine("==================================================\n");
        
        try
        {
            using var connection = new NpgsqlConnection(connectionString);
            Console.WriteLine("Connecting to database...");
            connection.Open();
            Console.WriteLine("✅ Connected successfully\n");
            
            using var command = connection.CreateCommand();
            command.CommandText = @"
                -- Create showroom_label_requests table
                CREATE TABLE IF NOT EXISTS showroom_label_requests (
                    ""Id"" UUID NOT NULL PRIMARY KEY,
                    outlet_id UUID NOT NULL,
                    text_1 VARCHAR(100) NOT NULL,
                    text_2 VARCHAR(100),
                    label_count INTEGER NOT NULL,
                    request_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                    ""CreatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
                    ""UpdatedAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
                    ""CreatedById"" UUID,
                    ""UpdatedById"" UUID,
                    
                    CONSTRAINT ""FK_showroom_label_requests_outlets_outlet_id"" 
                        FOREIGN KEY (outlet_id) 
                        REFERENCES outlets(""Id"") 
                        ON DELETE CASCADE,
                        
                    CONSTRAINT ""FK_showroom_label_requests_users_CreatedById"" 
                        FOREIGN KEY (""CreatedById"") 
                        REFERENCES users(""Id"") 
                        ON DELETE SET NULL,
                        
                    CONSTRAINT ""FK_showroom_label_requests_users_UpdatedById"" 
                        FOREIGN KEY (""UpdatedById"") 
                        REFERENCES users(""Id"") 
                        ON DELETE SET NULL
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS ""IX_showroom_label_requests_CreatedById"" 
                    ON showroom_label_requests(""CreatedById"");

                CREATE INDEX IF NOT EXISTS ""IX_showroom_label_requests_outlet_id"" 
                    ON showroom_label_requests(outlet_id);

                CREATE INDEX IF NOT EXISTS ""IX_showroom_label_requests_UpdatedById"" 
                    ON showroom_label_requests(""UpdatedById"");

                -- Insert migration history record
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES ('20260429040000_AddShowroomLabelRequests', '10.0.0')
                ON CONFLICT (""MigrationId"") DO NOTHING;
            ";
            
            Console.WriteLine("Executing migration SQL...");
            command.ExecuteNonQuery();
            
            Console.WriteLine("\n==================================================");
            Console.WriteLine("  ✅ Migration Applied Successfully!");
            Console.WriteLine("==================================================\n");
            Console.WriteLine("✅ Table 'showroom_label_requests' created");
            Console.WriteLine("✅ Foreign keys configured");
            Console.WriteLine("✅ Indexes created");
            Console.WriteLine("✅ Migration history updated\n");
            Console.WriteLine("You can now restart your backend and use the");
            Console.WriteLine("Showroom Label Printing feature!\n");
        }
        catch (NpgsqlException ex)
        {
            Console.WriteLine($"\n❌ Database Error: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"   Details: {ex.InnerException.Message}");
            Environment.Exit(1);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Error: {ex.Message}");
            Console.WriteLine($"   Details: {ex}");
            Environment.Exit(1);
        }
    }
}
