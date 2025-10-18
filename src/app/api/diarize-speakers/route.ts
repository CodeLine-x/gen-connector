import { NextRequest, NextResponse } from "next/server";
import { speakerDiarizationService } from "@/lib/speakerDiarization";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
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

    return NextResponse.json({
      success: true,
      diarization: diarizationResult,
      speakerRoles,
      conversationTurns,
      speakers: diarizationResult.speakers,
      totalDuration: diarizationResult.totalDuration,
    });
  } catch (error: any) {
    console.error("Speaker diarization error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze speakers",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
