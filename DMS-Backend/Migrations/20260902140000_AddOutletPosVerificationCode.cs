using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations;

/// <summary>
/// Adds POS Verification Code on showrooms. Used only to bind a POS till — not the public Code.
/// Idempotent.
/// </summary>
[Migration("20260902140000_AddOutletPosVerificationCode")]
public partial class AddOutletPosVerificationCode : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            DO $MIG$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = 'outlets'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'outlets'
                      AND column_name = 'pos_verification_code'
                ) THEN
                    ALTER TABLE outlets
                      ADD COLUMN pos_verification_code character varying(40);
                END IF;

                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'outlets'
                      AND column_name = 'pos_verification_code'
                ) AND NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = current_schema()
                      AND indexname = 'ix_outlets_pos_verification_code'
                ) THEN
                    CREATE UNIQUE INDEX ix_outlets_pos_verification_code
                      ON outlets (lower(pos_verification_code))
                      WHERE pos_verification_code IS NOT NULL
                        AND btrim(pos_verification_code) <> '';
                END IF;
            END
            $MIG$;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
            DROP INDEX IF EXISTS ix_outlets_pos_verification_code;
            ALTER TABLE outlets DROP COLUMN IF EXISTS pos_verification_code;
        ");
    }
}
