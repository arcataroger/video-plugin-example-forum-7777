import { Button, Canvas } from "datocms-react-ui";
import { buildClient } from "@datocms/cma-client-browser";
import type { UploadTrack } from "@datocms/cma-client/src/generated/SimpleSchemaTypes";
import { RenderUploadSidebarPanelCtx } from "datocms-plugin-sdk";
import { useEffect, useState } from "react";

type AssetSidebarPanelProps = {
  ctx: RenderUploadSidebarPanelCtx;
};

type TrackFilesByTrack = {
  [trackId: string]: string;
};

export const UploadSidebarPanel = ({ ctx }: AssetSidebarPanelProps) => {
  const { upload, currentUserAccessToken } = ctx;
  const [tracks, setTracks] = useState<UploadTrack[]>([]);
  const [trackFiles, setTrackFiles] = useState<TrackFilesByTrack>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  if (!currentUserAccessToken) {
    return (
      <Canvas ctx={ctx}>
        <h2>Error: Insufficient permissions</h2>
        <p>
          This plugin needs the current user access token. Please make sure
          you've granted it in the plugin settings.
        </p>
      </Canvas>
    );
  }

  const client = buildClient({
    apiToken: currentUserAccessToken,
  });

  useEffect(() => {
    setIsLoading(true);

    const fetchTracks = async () => {
      const response = await client.uploadTracks.list(upload.id);
      setTracks(response);
    };

    fetchTracks();
    setIsLoading(false);
  }, [upload.id]);

  useEffect(() => {
    setIsLoading(true);

    const fetchTrackFiles = async () => {
      try {
        const concurrentFetches = tracks.map(async (track) => {
          const response = await fetch(
            `https://stream.mux.com/${upload.attributes.mux_playback_id}/text/${track.id}.vtt`,
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch track ${track.id}: ${response.statusText}`,
            );
          }
          return {
            [track.id]: await response.text(),
          };
        });

        const responses = await Promise.all(concurrentFetches);
        setTrackFiles(Object.assign({}, ...responses));
      } catch (error) {
        console.error("Fetch to Mux failed:", error);
        setTrackFiles({}); // Set an empty state or handle as necessary
      }
      setIsLoading(false);
    };

    fetchTrackFiles();
  }, [tracks]);

  const handleReplace = async () => {
    setIsLoading(true);

    if (!tracks?.length) {
      await ctx.alert("This video has no subtitle tracks to process.");
      setIsLoading(false);
      return;
    }

    const updatedTrackFiles = Object.fromEntries(
      Object.entries(trackFiles).map(([id, trackFile]) => [
        id,
        trackFile.replaceAll("subtitle", "subtitle WITH CHANGES"),
      ]),
    );

    try {
      await ctx.notice("Beginning subtitle replacement, please wait...");
      const concurrentUpdates = tracks.map(async (track) => {
        const updatedSubtitleFile = await client.uploads.createFromFileOrBlob({
          fileOrBlob: new Blob([updatedTrackFiles[track.id]], {
            type: "text/vtt",
          }),
          filename: `${track.upload.id}-${track.language_code}-replaced`,
        });

        // There's currently a bug with uploadTracks.create() (reported and awaiting a fix)
        // In the meantime we'll use rawCreate as a workaround

        await client.uploadTracks.rawCreate(track.upload.id, {
          data: {
            type: "upload_track",
            attributes: {
              url_or_upload_request_id: updatedSubtitleFile.url,
              type: "subtitles",
              language_code: track.language_code,
              name: `${track.name} - Replaced`,
            },
          },
        });
      });

      await Promise.all(concurrentUpdates);
      await ctx.notice(
        `Successfully added ${concurrentUpdates.length} new subtitle track(s)`,
      );
    } catch (error) {
      await ctx.alert(`Failed to add subtitle tracks: ${error}`);
      console.error("Track replacements failed", error);
    }

    setIsLoading(false);
  };

  return (
    <Canvas ctx={ctx}>
      {isLoading && <p>Loading, please wait...</p>}

      {!isLoading && (
        <>
          <Button onClick={handleReplace}>
            Replace words in subtitle tracks
          </Button>
          <p>
            Clicking this button will add a new subtitle track with the word
            "subtitle" replaced with "subtitle WITH CHANGES"
          </p>
          <details>
            <summary>Debug Info</summary>
            <h3>Track files</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(trackFiles, null, 2)}
            </pre>
            <h3>Tracks</h3>
            <pre>{JSON.stringify(tracks, null, 2)}</pre>
            <h3>Upload data</h3>
            <pre>{JSON.stringify(upload, null, 2)}</pre>
          </details>
        </>
      )}
    </Canvas>
  );
};
