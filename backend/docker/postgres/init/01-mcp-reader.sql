DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='mcp_reader') THEN
    CREATE ROLE mcp_reader LOGIN PASSWORD 'mcp_reader_local';
  END IF;
END $$;
GRANT CONNECT ON DATABASE geotwin TO mcp_reader;
GRANT USAGE ON SCHEMA public TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE geotwin IN SCHEMA public GRANT SELECT ON TABLES TO mcp_reader;
