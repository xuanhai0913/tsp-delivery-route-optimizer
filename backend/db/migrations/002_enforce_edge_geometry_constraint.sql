UPDATE graph_edges
SET geometry = NULL
WHERE geometry IS NOT NULL
  AND (
    jsonb_typeof(geometry) <> 'array'
    OR jsonb_array_length(geometry) < 2
  );

ALTER TABLE graph_edges
  DROP CONSTRAINT IF EXISTS graph_edges_geometry_array;

ALTER TABLE graph_edges
  ADD CONSTRAINT graph_edges_geometry_array
  CHECK (
    geometry IS NULL OR
    (jsonb_typeof(geometry) = 'array' AND jsonb_array_length(geometry) >= 2)
  );
