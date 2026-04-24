const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schemaContents = fs.readFileSync(schemaPath, "utf8");
  const modelMatch = schemaContents.match(
    /model\s+BotAutomation\s*\{[\s\S]*?\n\}/m
  );

  console.log("Prisma model BotAutomation @@map inspection:");
  if (!modelMatch) {
    console.log("- BotAutomation model block not found in prisma/schema.prisma");
  } else {
    const mapMatch = modelMatch[0].match(/@@map\("([^"]+)"\)/);
    if (mapMatch) {
      console.log(`- Found @@map(\"${mapMatch[1]}\")`);
    } else {
      console.log("- No @@map found inside model BotAutomation");
    }
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const tableResult = await client.query(
      `
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND (
            table_name ILIKE '%botautomation%'
            OR table_name ILIKE '%bot_automation%'
          )
        ORDER BY table_schema, table_name
      `
    );

    console.log("");
    console.log("Matching tables:");

    if (tableResult.rows.length === 0) {
      console.log("- No matching tables found");
    } else {
      for (const row of tableResult.rows) {
        console.log(`- ${row.table_schema}.${row.table_name}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Diagnosis failed:");
  console.error(error);
  process.exit(1);
});
