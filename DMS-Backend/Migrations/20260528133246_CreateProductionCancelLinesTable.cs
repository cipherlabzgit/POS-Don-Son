using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DMS_Backend.Migrations
{
    /// <inheritdoc />
    public partial class CreateProductionCancelLinesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if table already exists (to handle cases where it was manually created)
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM information_schema.tables 
                                 WHERE table_schema = 'public' 
                                 AND table_name = 'production_cancel_lines') THEN
                        CREATE TABLE production_cancel_lines (
                            ""Id"" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            production_cancel_id UUID NOT NULL,
                            product_id UUID NOT NULL,
                            production_section_id UUID NOT NULL,
                            cancelled_qty DECIMAL(18,4) NOT NULL,
                            line_no INTEGER NOT NULL,
                            ""IsActive"" BOOLEAN NOT NULL DEFAULT true,
                            ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                            ""UpdatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                            ""CreatedById"" UUID,
                            ""UpdatedById"" UUID,
                            
                            CONSTRAINT fk_production_cancel_lines_production_cancel_id
                                FOREIGN KEY (production_cancel_id)
                                REFERENCES production_cancels(""Id"")
                                ON DELETE RESTRICT,
                            
                            CONSTRAINT fk_production_cancel_lines_product_id
                                FOREIGN KEY (product_id)
                                REFERENCES products(""Id"")
                                ON DELETE RESTRICT,
                            
                            CONSTRAINT fk_production_cancel_lines_production_section_id
                                FOREIGN KEY (production_section_id)
                                REFERENCES production_sections(""Id"")
                                ON DELETE RESTRICT,
                            
                            CONSTRAINT ""FK_production_cancel_lines_users_CreatedById""
                                FOREIGN KEY (""CreatedById"")
                                REFERENCES users(""Id""),
                            
                            CONSTRAINT ""FK_production_cancel_lines_users_UpdatedById""
                                FOREIGN KEY (""UpdatedById"")
                                REFERENCES users(""Id"")
                        );
                        
                        CREATE INDEX ix_production_cancel_lines_production_cancel_id
                            ON production_cancel_lines(production_cancel_id);
                        CREATE INDEX ix_production_cancel_lines_product_id
                            ON production_cancel_lines(product_id);
                        CREATE INDEX ix_production_cancel_lines_production_section_id
                            ON production_cancel_lines(production_section_id);
                        CREATE INDEX ""IX_production_cancel_lines_CreatedById""
                            ON production_cancel_lines(""CreatedById"");
                        CREATE INDEX ""IX_production_cancel_lines_UpdatedById""
                            ON production_cancel_lines(""UpdatedById"");
                    END IF;
                END
                $$;
            
            -- Add missing columns if table already exists (idempotent)
            ALTER TABLE production_cancel_lines 
            ADD COLUMN IF NOT EXISTS ""CreatedById"" UUID,
            ADD COLUMN IF NOT EXISTS ""UpdatedById"" UUID;
            
            -- Add constraints if not exists
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_production_cancel_lines_users_CreatedById'
                ) THEN
                    ALTER TABLE production_cancel_lines
                    ADD CONSTRAINT ""FK_production_cancel_lines_users_CreatedById""
                    FOREIGN KEY (""CreatedById"") REFERENCES users(""Id"");
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'FK_production_cancel_lines_users_UpdatedById'
                ) THEN
                    ALTER TABLE production_cancel_lines
                    ADD CONSTRAINT ""FK_production_cancel_lines_users_UpdatedById""
                    FOREIGN KEY (""UpdatedById"") REFERENCES users(""Id"");
                END IF;
            END $$;
            
            -- Add indexes if not exists
            CREATE INDEX IF NOT EXISTS ""IX_production_cancel_lines_CreatedById""
                ON production_cancel_lines(""CreatedById"");
            CREATE INDEX IF NOT EXISTS ""IX_production_cancel_lines_UpdatedById""
                ON production_cancel_lines(""UpdatedById"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS production_cancel_lines;");
        }
    }
}
