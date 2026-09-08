using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

[Migration("20260908050000_AddTransferReceivedBy")]
public partial class AddTransferReceivedBy : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE transfers
                ADD COLUMN IF NOT EXISTS received_by_id uuid NULL;
            ALTER TABLE transfers
                ADD COLUMN IF NOT EXISTS received_at timestamp with time zone NULL;

            DO $MIG$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'fk_transfers_users_received_by_id'
                ) THEN
                    ALTER TABLE transfers
                        ADD CONSTRAINT fk_transfers_users_received_by_id
                        FOREIGN KEY (received_by_id) REFERENCES users ("Id")
                        ON DELETE SET NULL;
                END IF;
            END
            $MIG$;

            CREATE INDEX IF NOT EXISTS ix_transfers_received_by_id ON transfers (received_by_id);
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            ALTER TABLE transfers DROP CONSTRAINT IF EXISTS fk_transfers_users_received_by_id;
            DROP INDEX IF EXISTS ix_transfers_received_by_id;
            ALTER TABLE transfers DROP COLUMN IF EXISTS received_by_id;
            ALTER TABLE transfers DROP COLUMN IF EXISTS received_at;
        ");
    }
}
