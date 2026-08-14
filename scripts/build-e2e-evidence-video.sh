#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu/verisettle"
CAPTURES="/home/ubuntu/screenshots"
OUT_DIR="/home/ubuntu/Downloads/verisettle-e2e-video"
OUT_VIDEO="/home/ubuntu/Downloads/VeriSettle-real-testnet-evidence-walkthrough.mp4"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/*.mp4 "$OUT_DIR"/concat.txt "$OUT_VIDEO"

make_capture_scene() {
  local input="$1"
  local output="$2"
  local duration="$3"
  local title="$4"
  local subtitle="$5"
  ffmpeg -y -loop 1 -i "$input" -t "$duration" \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x040b0e,drawbox=x=0:y=0:w=1280:h=118:color=0x040b0e@0.92:t=fill,drawtext=fontfile=${FONT}:text='${title}':x=48:y=34:fontsize=30:fontcolor=0xcffafe,drawtext=fontfile=${FONT}:text='${subtitle}':x=48:y=78:fontsize=19:fontcolor=0x94a3b8,format=yuv420p" \
    -r 30 -c:v libx264 -preset medium -crf 20 -an "$output"
}

make_evidence_card() {
  local output="$1"
  local duration="$2"
  local eyebrow="$3"
  local title="$4"
  local line1="$5"
  local line2="$6"
  local tx="${7:-Public verification detail recorded in the project inventory}"
  ffmpeg -y -f lavfi -i "color=c=0x040b0e:s=1280x720:d=${duration}" \
    -vf "drawbox=x=36:y=36:w=1208:h=648:color=0x0a1b21:t=fill,drawbox=x=36:y=36:w=1208:h=648:color=0x67e8f9@0.55:t=2,drawbox=x=76:y=168:w=1128:h=1:color=0x67e8f9@0.3:t=fill,drawtext=fontfile=${FONT}:text='${eyebrow}':x=76:y=92:fontsize=21:fontcolor=0x67e8f9,drawtext=fontfile=${FONT}:text='${title}':x=76:y=220:fontsize=45:fontcolor=0xffffff,drawtext=fontfile=${FONT}:text='${line1}':x=76:y=310:fontsize=25:fontcolor=0xcbd5e1,drawtext=fontfile=${FONT}:text='${line2}':x=76:y=352:fontsize=25:fontcolor=0xcbd5e1,drawbox=x=76:y=472:w=1128:h=92:color=0x071216:t=fill,drawtext=fontfile=${FONT}:text='${tx}':x=102:y=506:fontsize=18:fontcolor=0x99f6e4,drawtext=fontfile=${FONT}:text='Public testnet evidence · no wallet-approval scene is fabricated':x=76:y=624:fontsize=17:fontcolor=0x94a3b8,format=yuv420p" \
    -r 30 -c:v libx264 -preset medium -crf 20 -an "$output"
}

make_capture_scene "$CAPTURES/webdev-preview-root-1786675798157222385-9354.png" "$OUT_DIR/01-product.mp4" 7 "VERISETTLE · REAL TESTNET DEMONSTRATION" "Attestcoin-governed cross-chain escrow on Sepolia and Creditcoin CC3"
make_capture_scene "$CAPTURES/webdev-preview-app-1786675555245973584-6326.png" "$OUT_DIR/02-command-center.mp4" 7 "1 · CREATE AND FUND" "The authenticated deal register guides the wallet, network, and order lifecycle"
make_capture_scene "$CAPTURES/sepolia_etherscan_io_2026-08-14_03-07-30_5760.webp" "$OUT_DIR/03-source-proof.mp4" 8 "2 · SOURCE ACCEPTANCE" "The captured Etherscan receipt confirms a successful Sepolia call to the trusted source emitter"
make_evidence_card "$OUT_DIR/04-funding.mp4" 7 "3 · CC3 ESCROW FUNDING" "Native tCTC escrow was funded for the real test order." "The receipt is independently linked in the project inventory." "0x697521752906afd4b98f1d05f4af7cf82ccde2737fe532b1ee9a7b0b40271d94"
make_evidence_card "$OUT_DIR/05-attestcoin-release.mp4" 8 "4 · ATTESTCOIN PROOF AND RELEASE" "The official proof path was submitted to the deployed ASC." "Creditcoin receipt state transitioned the test order to Released." "0x0e8c31dc7d8d42066e4285d2362547a5f2cbcd1ca53a2a1662234d657b3dd6df"
make_evidence_card "$OUT_DIR/06-security-boundary.mp4" 8 "5 · REPLAY PROTECTION" "The same valid proof was attempted a second time." "The deployed ASC returned QueryAlreadyProcessed and rejected settlement." "Exact UI error is documented in E2E_DEMO_SCRIPT.md"
make_capture_scene "$CAPTURES/webdev-preview-app-1786675665384624237-9568.png" "$OUT_DIR/07-responsive.mp4" 7 "RESPONSIVE COMMAND CENTER" "The mobile workspace retains the guided real-testnet path and accessible controls"
make_evidence_card "$OUT_DIR/08-close.mp4" 6 "VERIFICATION SUMMARY" "UI capture uses the sandbox browser; real transactions use the dedicated testnet-only signer." "Explore the exact receipts and contracts in docs/DEPLOYMENT_INVENTORY.md." "Sepolia source · CC3 funding · Attestcoin release · on-chain replay rejection"

for scene in "$OUT_DIR"/[0-9][0-9]-*.mp4; do
  printf "file '%s'\n" "$scene" >> "$OUT_DIR/concat.txt"
done
ffmpeg -y -f concat -safe 0 -i "$OUT_DIR/concat.txt" -c copy -movflags +faststart "$OUT_VIDEO"
printf 'Video created: %s\n' "$OUT_VIDEO"
