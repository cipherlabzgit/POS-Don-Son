using Microsoft.EntityFrameworkCore.Migrations;

namespace DMS_Backend.Migrations;

/// <inheritdoc />
public partial class AutoApprovePosSales : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Update all existing Pending sales to Approved
        // Set approver to the creator and approval timestamp to creation timestamp
        migrationBuilder.Sql(@"
            DO $EF$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'pos_sales'
                      AND column_name = 'status'
                ) THEN
                    UPDATE pos_sales 
                    SET status = 'Approved',
                        approved_by_id = ""CreatedById"",
                        approved_at = ""CreatedAt""
                    WHERE status = 'Pending' AND ""IsActive"" = true;
                    
                    -- Change the default status for new sales to 'Approved'
                    ALTER TABLE pos_sales 
                        ALTER COLUMN status SET DEFAULT 'Approved';
                END IF;
            END $EF$;
        ");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Revert the default back to 'Pending'
        migrationBuilder.Sql(@"
            DO $EF$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'pos_sales'
                      AND column_name = 'status'
                ) THEN
                    ALTER TABLE pos_sales 
                        ALTER COLUMN status SET DEFAULT 'Pending';
                END IF;
            END $EF$;
        ");
    }
}
