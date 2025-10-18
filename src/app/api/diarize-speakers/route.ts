import { NextRequest, NextResponse } from "next/server";
import { speakerDiarizationService } from "@/lib/speakerDiarization";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const sessionId = formData.get("sessionId") as string;
    const segmentNumber = parseInt(formData.get("segmentNumber") as string);

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!sessionId || !segmentNumber) {
      return NextResponse.json(
        { error: "Missing sessionId or segmentNumber" },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Analyze speakers using diarization
    const diarizationResult = await speakerDiarizationService.analyzeSpeakers(
      audioBlob
    );

    // Identify speaker roles (elderly vs young adult)
    const speakerRoles =
      speakerDiarizationService.identifySpeakerRoles(diarizationResult);

    // Convert to conversation turns
    const conversationTurns =
      speakerDiarizationService.convertToConversationTurns(
        diarizationResult,
        speakerRoles
      );

    // Save to database
    const supabase = await createClient();

    // Create segment
    const startTime = (segmentNumber - 1) * 30;
    const endTime = segmentNumber * 30;

    const { data: segmentData, error: segmentError } = await supabase
      .from("segments")
      .insert({
        session_id: sessionId,
        segment_number: segmentNumber,
        start_time_seconds: startTime,
        end_time_seconds: endTime,
        duration_seconds: 30,
        transcription_status: "completed",
      })
      .select()
      .single();

    if (segmentError) {
      console.error("Error creating segment:", segmentError);
    }

    // Create turns if segment was created successfully
    if (segmentData) {
      // Use the raw diarization segments which have the correct properties
      const turnsData = diarizationResult.segments.map((segment, index) => {
        // Map speaker to role based on speakerRoles
        let speakerRole: "elderly" | "young_adult";
        if (speakerRoles.elderly.includes(segment.speaker)) {
          speakerRole = "elderly";
        } else if (speakerRoles.youngAdult.includes(segment.speaker)) {
          speakerRole = "young_adult";
        } else {
          speakerRole = "young_adult"; // Default
        }

        return {
          segment_id: segmentData.id,
          session_id: sessionId,
          speaker: speakerRole,
          speaker_id: segment.speaker, // Original speaker ID from diarization
          transcript: segment.text,
          start_time_seconds: segment.startTime,
          end_time_seconds: segment.endTime,
          turn_number: index + 1,
        };
      });

      const { error: turnsError } = await supabase
        .from("turns")
        .insert(turnsData);

      if (turnsError) {
        console.error("Error creating turns:", turnsError);
      }
    }

    return NextResponse.json({
      success: true,
      diarization: diarizationResult,
      speakerRoles,
      conversationTurns,
      speakers: diarizationResult.speakers,
      totalDuration: diarizationResult.totalDuration,
    });
  } catch (error: unknown) {
    console.error("Speaker diarization error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to analyze speakers",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
