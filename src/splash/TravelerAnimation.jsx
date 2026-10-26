import React from 'react';

/**
 * TravelerAnimation
 * Premium 2D-illustrated young adult male traveler (22-28 yrs old).
 * Professional brand-mascot quality inspired by reference.
 *
 * Anatomy & Styling:
 * - Smart, attractive hairstyle with textured volume and clean fade
 * - Handsome, well-defined facial features with confident friendly expression
 * - Athletic, natural young-adult body proportions (balanced head-to-body ratio)
 * - Well-fitted crisp white T-shirt with natural fabric draping
 * - Stylish dark-blue tailored trousers with clean seamlines
 * - Modern white sneakers with clean soles firmly aligned to the ground
 * - Fitted mustard-orange travel backpack
 * - Realistic red hardshell rolling suitcase (trolley) with metallic handle and spinning wheels
 */
export default function TravelerAnimation({ phase = 'walk' }) {
  // phase: 'walk' | 'pause' | 'entering' | 'entered'
  const isWalking = phase === 'walk';
  const isEntering = phase === 'entering';
  const isEntered = phase === 'entered';

  return (
    <div
      className={`traveler-container traveler-phase-${phase}`}
      aria-hidden="true"
    >
      <svg
        className={`traveler-svg ${isWalking ? 'is-walking' : ''} ${isEntering ? 'is-entering' : ''}`}
        viewBox="0 0 180 230"
        width="155"
        height="198"
        aria-hidden="true"
        style={{
          overflow: 'visible',
          opacity: isEntered ? 0 : 1,
          transform: isEntering ? 'scale(0.72) translateY(-4px)' : 'scale(1)',
          transformOrigin: 'bottom center',
          transition: 'transform 1.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease',
        }}
      >
        <defs>
          {/* Floor Contact Shadows */}
          <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#040b18" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#040b18" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#040b18" stopOpacity="0" />
          </radialGradient>

          {/* Natural Skin Gradients */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd8b8" />
            <stop offset="60%" stopColor="#f7ba8d" />
            <stop offset="100%" stopColor="#e39a67" />
          </linearGradient>

          <linearGradient id="skinShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5ae7e" />
            <stop offset="100%" stopColor="#d98048" />
          </linearGradient>

          {/* Smart Hairstyle Gradients */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d2b20" />
            <stop offset="50%" stopColor="#241710" />
            <stop offset="100%" stopColor="#140c08" />
          </linearGradient>

          <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#634533" />
            <stop offset="100%" stopColor="#382215" />
          </linearGradient>

          {/* Fitted White Shirt */}
          <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f4f6f9" />
            <stop offset="100%" stopColor="#e1e6ee" />
          </linearGradient>

          <linearGradient id="shirtShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Stylish Dark-Blue Trousers */}
          <linearGradient id="pantsFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a68" />
            <stop offset="45%" stopColor="#162c50" />
            <stop offset="100%" stopColor="#0f1d38" />
          </linearGradient>

          <linearGradient id="pantsBack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#162c50" />
            <stop offset="50%" stopColor="#0f1f3a" />
            <stop offset="100%" stopColor="#0a1528" />
          </linearGradient>

          {/* Mustard / Orange Travel Backpack */}
          <linearGradient id="backpackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#b43403" />
          </linearGradient>

          <linearGradient id="backpackFrontPocket" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>

          {/* Red Rolling Suitcase */}
          <linearGradient id="suitcaseBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="35%" stopColor="#dc2626" />
            <stop offset="85%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          <linearGradient id="suitcaseGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="18%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>

          {/* Metallic Pull Handle */}
          <linearGradient id="metalPoles" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* ── Floor Contact Shadows ── */}
        <g className="traveler-shadows">
          {/* Suitcase wheels shadow */}
          <ellipse cx="38" cy="216" rx="22" ry="5.5" fill="url(#floorShadow)" />
          {/* Boy feet contact shadow */}
          <ellipse cx="106" cy="217" rx="36" ry="6.5" fill="url(#floorShadow)" />
        </g>

        {/* ── RED ROLLING SUITCASE (TROLLEY) ── */}
        <g className="traveler-suitcase-group">
          {/* Telescopic aluminum handle extending up into traveler's left hand */}
          <g className="trolley-handle">
            <line x1="30" y1="152" x2="68" y2="106" stroke="url(#metalPoles)" strokeWidth="3" strokeLinecap="round" />
            <line x1="36" y1="152" x2="73" y2="107" stroke="url(#metalPoles)" strokeWidth="3" strokeLinecap="round" />
            {/* Cross brace */}
            <line x1="41" y1="139" x2="47" y2="140" stroke="#1e293b" strokeWidth="2.5" />
            {/* Ergonomic handle grip */}
            <rect
              x="65"
              y="101"
              width="14"
              height="7"
              rx="3"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.8"
              transform="rotate(-40 72 104.5)"
            />
          </g>

          {/* Suitcase Main Hardshell Body */}
          <g className="trolley-case" transform="rotate(-7 36 182)">
            {/* Ambient drop shadow behind case */}
            <rect x="13" y="145" width="42" height="60" rx="8" fill="#000000" opacity="0.22" />

            {/* Rich Red Luggage Shell */}
            <rect x="14" y="144" width="42" height="60" rx="9" fill="url(#suitcaseBody)" stroke="#991b1b" strokeWidth="1.2" />
            <rect x="14" y="144" width="42" height="60" rx="9" fill="url(#suitcaseGloss)" />

            {/* Molded horizontal texture ribs */}
            <path d="M20 156 H48 M20 164 H48 M20 172 H48 M20 180 H48 M20 188 H48" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.32" strokeLinecap="round" />
            <path d="M20 157 H48 M20 165 H48 M20 173 H48 M20 181 H48 M20 189 H48" stroke="#450a0a" strokeWidth="1" strokeOpacity="0.45" strokeLinecap="round" />

            {/* Corner guards in matte black */}
            <path d="M14 153 Q14 144 23 144" fill="none" stroke="#0f172a" strokeWidth="3.2" />
            <path d="M47 144 Q56 144 56 153" fill="none" stroke="#0f172a" strokeWidth="3.2" />
            <path d="M14 195 Q14 204 23 204" fill="none" stroke="#0f172a" strokeWidth="3.2" />
            <path d="M47 204 Q56 204 56 195" fill="none" stroke="#0f172a" strokeWidth="3.2" />

            {/* Perimeter zipper tape */}
            <rect x="17" y="147" width="36" height="54" rx="7" fill="none" stroke="#1f2937" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />

            {/* Side handle & gold Atithi badge */}
            <rect x="11.5" y="168" width="4" height="14" rx="2" fill="#0f172a" />
            <circle cx="35" cy="159" r="3.2" fill="#e2bf73" stroke="#b45309" strokeWidth="0.6" />

            {/* Spinner Wheels (Rotates naturally with motion) */}
            {/* Left Wheel */}
            <g className="suitcase-wheel suitcase-wheel-left" style={{ transformOrigin: '23px 207px' }}>
              <circle cx="23" cy="207" r="5.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
              <circle cx="23" cy="207" r="2.8" fill="#cbd5e1" />
              <line x1="23" y1="203" x2="23" y2="211" stroke="#475569" strokeWidth="1" />
              <line x1="19" y1="207" x2="27" y2="207" stroke="#475569" strokeWidth="1" />
            </g>

            {/* Right Wheel */}
            <g className="suitcase-wheel suitcase-wheel-right" style={{ transformOrigin: '47px 207px' }}>
              <circle cx="47" cy="207" r="5.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
              <circle cx="47" cy="207" r="2.8" fill="#cbd5e1" />
              <line x1="47" y1="203" x2="47" y2="211" stroke="#475569" strokeWidth="1" />
              <line x1="43" y1="207" x2="51" y2="207" stroke="#475569" strokeWidth="1" />
            </g>
          </g>
        </g>

        {/* ── THE TRAVELER (YOUNG ADULT MALE 22-28 YRS OLD) ── */}
        <g className="traveler-body-group">

          {/* 1. Back Arm (Left Arm, holding suitcase handle) */}
          <g className="boy-back-arm" style={{ transformOrigin: '96px 85px' }}>
            {/* White T-shirt sleeve */}
            <path
              d="M93 81 L82 96 L91 100 L100 85 Z"
              fill="url(#shirtGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.7"
            />
            {/* Athletic Forearm skin */}
            <path
              d="M84 95 L73 107 L78 112 L89 99 Z"
              fill="url(#skinGrad)"
            />
            {/* Natural Hand gripping handle with articulated fingers */}
            <g className="boy-hand-grip">
              <circle cx="75" cy="108" r="5" fill="url(#skinGrad)" />
              {/* Distinct fingers curled around grip */}
              <path d="M71 105 Q75 102 78 105" stroke="#b87445" strokeWidth="1.2" fill="none" />
              <path d="M72 108 Q76 105 79 108" stroke="#b87445" strokeWidth="1.2" fill="none" />
              <path d="M73 111 Q77 108 80 111" stroke="#b87445" strokeWidth="1.2" fill="none" />
            </g>
          </g>

          {/* 2. Back Leg (Right Leg) in Dark-Blue Trousers */}
          <g className="boy-back-leg" style={{ transformOrigin: '108px 135px' }}>
            {/* Thigh */}
            <path
              d="M101 133 L116 133 L113 170 L99 170 Z"
              fill="url(#pantsBack)"
            />
            {/* Calf / Shin & Clean Sneaker */}
            <g className="boy-back-shin" style={{ transformOrigin: '106px 170px' }}>
              <path
                d="M99 168 L113 168 L110 203 L98 203 Z"
                fill="url(#pantsBack)"
              />
              {/* Trouser hem cuff */}
              <line x1="98" y1="202" x2="110" y2="202" stroke="#2563eb" strokeWidth="1.2" strokeOpacity="0.5" />

              {/* Modern White Sneaker Back */}
              <g className="sneaker-back">
                {/* Sneaker Upper */}
                <path
                  d="M95 203 Q99 198 109 200 L118 205 Q119 211 114 213 L93 213 Q92 208 95 203 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Dark Rubber Outsole */}
                <path d="M93 210 H117 V214 H93 Z" fill="#0f172a" />
                {/* Navy & gold accent flashes */}
                <line x1="99" y1="205" x2="109" y2="205" stroke="#1d4ed8" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="102" y1="207" x2="108" y2="207" stroke="#e2bf73" strokeWidth="1" strokeLinecap="round" />
              </g>
            </g>
          </g>

          {/* 3. Front Leg (Left Leg) in Dark-Blue Trousers */}
          <g className="boy-front-leg" style={{ transformOrigin: '98px 135px' }}>
            {/* Thigh with natural contour */}
            <path
              d="M91 133 L106 133 L104 170 L89 170 Z"
              fill="url(#pantsFront)"
            />
            {/* Trouser crease highlight & seam */}
            <line x1="99" y1="137" x2="97" y2="166" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.35" />
            <path d="M91 136 Q96 142 93 151" stroke="#0f1d38" strokeWidth="1.2" fill="none" opacity="0.6" />

            {/* Calf / Shin & Clean Sneaker */}
            <g className="boy-front-shin" style={{ transformOrigin: '96px 170px' }}>
              <path
                d="M89 168 L104 168 L101 203 L87 203 Z"
                fill="url(#pantsFront)"
              />
              {/* Trouser hem cuff */}
              <line x1="87" y1="202" x2="101" y2="202" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.5" />

              {/* Modern White Sneaker Front */}
              <g className="sneaker-front">
                {/* Sneaker Upper */}
                <path
                  d="M85 203 Q89 197 100 199 L110 205 Q111 211 106 213 L83 213 Q82 208 85 203 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Dark Rubber Outsole */}
                <path d="M83 210 H109 V214 H83 Z" fill="#0f172a" />
                {/* Navy & gold athletic stripes */}
                <line x1="90" y1="204" x2="101" y2="204" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="93" y1="206" x2="100" y2="206" stroke="#e2bf73" strokeWidth="1.1" strokeLinecap="round" />
                {/* Lacing eyelets */}
                <circle cx="93" cy="201" r="1.1" fill="#94a3b8" />
                <circle cx="97" cy="201" r="1.1" fill="#94a3b8" />
              </g>
            </g>
          </g>

          {/* 4. Torso with Mustard-Orange Backpack & Well-fitted White Shirt */}
          <g className="boy-torso">
            {/* Fitted Mustard-Orange Backpack (Worn naturally on back) */}
            <g className="boy-backpack">
              {/* Main pack shell */}
              <rect x="68" y="77" width="24" height="46" rx="10" fill="url(#backpackGrad)" stroke="#9a3412" strokeWidth="1.2" />
              {/* Front accessory pocket */}
              <rect x="66" y="93" width="20" height="25" rx="7" fill="url(#backpackFrontPocket)" stroke="#c2410c" strokeWidth="0.9" />
              {/* Zipper seam line */}
              <path d="M68 92 H84" stroke="#7c2d12" strokeWidth="1.2" strokeDasharray="2 1.5" />
              <circle cx="83" cy="92" r="1.6" fill="#0f172a" />
              {/* Top grab handle */}
              <path d="M74 77 Q78 69 84 77" stroke="#9a3412" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>

            {/* Well-fitted White T-Shirt / Shirt */}
            <path
              d="M87 73 L113 73 Q119 102 111 135 L89 135 Q83 104 87 73 Z"
              fill="url(#shirtGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />

            {/* Tailored Fabric Folds & Shading */}
            <path d="M92 85 Q102 91 108 87" stroke="#cbd5e1" strokeWidth="1.2" fill="none" opacity="0.8" />
            <path d="M90 105 Q100 111 107 107" stroke="#cbd5e1" strokeWidth="1.2" fill="none" opacity="0.7" />
            <path d="M92 125 Q101 129 108 126" stroke="#cbd5e1" strokeWidth="1.1" fill="none" opacity="0.6" />

            {/* Trouser waistband / dark belt */}
            <rect x="89" y="132" width="22" height="4" fill="#0f172a" rx="1" />
            <rect x="98" y="132.5" width="4" height="3" fill="#cbd5e1" rx="0.5" />

            {/* Backpack shoulder strap looping over right shoulder and chest */}
            <path
              d="M96 74 Q103 92 100 134"
              stroke="#9a3412"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M96 74 Q103 92 100 134"
              stroke="#f59e0b"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Sternum strap buckle */}
            <rect x="99" y="98" width="5" height="3" rx="1" fill="#0f172a" />
          </g>

          {/* 5. Front Arm (Right Arm, natural forward swing) */}
          <g className="boy-front-arm" style={{ transformOrigin: '106px 85px' }}>
            {/* White T-shirt sleeve */}
            <path
              d="M102 81 L118 83 L114 101 L100 97 Z"
              fill="url(#shirtGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.7"
            />
            {/* Defined forearm skin */}
            <path
              d="M104 98 L116 119 L122 116 L112 96 Z"
              fill="url(#skinGrad)"
            />
            {/* Natural hand with distinct fingers & thumb relaxed in stride */}
            <g className="boy-hand-front">
              <circle cx="118" cy="121" r="5" fill="url(#skinGrad)" />
              {/* Relaxed natural fingers */}
              <path d="M116 120 Q120 125 122 120" stroke="#b87445" strokeWidth="1.1" fill="none" />
              <path d="M115 122 Q119 127 121 123" stroke="#b87445" strokeWidth="1" fill="none" />
            </g>
          </g>

          {/* 6. Head, Handsome Face & Smart Hairstyle */}
          <g className="boy-head">
            {/* Strong athletic neck */}
            <rect x="97" y="62" width="11" height="15" fill="url(#skinGrad)" rx="3" />
            <path d="M97 68 Q103 73 108 68" stroke="#d98048" strokeWidth="1.3" fill="none" opacity="0.6" />

            {/* Well-proportioned Head Silhouette */}
            <ellipse cx="103" cy="50" rx="14" ry="15" fill="url(#skinGrad)" />

            {/* Defined Ear with interior contour */}
            <ellipse cx="96" cy="52" rx="3.5" ry="4.5" fill="url(#skinGrad)" stroke="#c28859" strokeWidth="0.8" />
            <path d="M95 50 Q97 52 95.5 54" stroke="#b87445" strokeWidth="0.9" fill="none" />

            {/* Smart Modern Hairstyle (Layered, textured volume, clean fade) */}
            <path
              d="
                M90 53
                Q89 39 96 32
                Q103 26 112 28
                Q120 30 122 40
                Q123 46 118 49
                Q115 43 111 44
                Q108 38 103 41
                Q98 44 96 52
                Z
              "
              fill="url(#hairGrad)"
            />
            {/* Hair texture strands & specular highlight */}
            <path d="M96 32 Q105 26 114 31 Q118 34 122 39" stroke="url(#hairHighlight)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M102 35 Q108 33 114 38" stroke="url(#hairHighlight)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M110 35 Q116 38 119 44" stroke="#4a3427" strokeWidth="1.3" fill="none" strokeLinecap="round" />

            {/* Handsome Facial Features (22-28 young adult male) */}
            {/* Confident almond eye with pupil and catchlight */}
            <ellipse cx="111" cy="48" rx="2.2" ry="2.5" fill="#0f172a" />
            <circle cx="111.8" cy="47.2" r="0.9" fill="#ffffff" />
            <circle cx="110.5" cy="49" r="0.5" fill="#3b82f6" />
            {/* Upper eyelash line */}
            <path d="M108 46 Q111 44.5 114 46" stroke="#0f172a" strokeWidth="1.4" fill="none" strokeLinecap="round" />

            {/* Smart groomed eyebrow */}
            <path d="M107 42 Q111 39.8 115 42" stroke="#1f150e" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Sculpted clean nose */}
            <path d="M113 47 L117 51 L112 52.5" stroke="#b87445" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Warm, confident smile */}
            <path d="M108 57.5 Q112 60.5 116 57" stroke="#994018" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {/* Subtle smile dimple */}
            <path d="M116.5 56 Q117.5 58 116 59.5" stroke="#c28859" strokeWidth="1" fill="none" />

            {/* Soft natural cheek warmth */}
            <circle cx="107" cy="52" r="3" fill="#f87171" opacity="0.25" />
          </g>

        </g>
      </svg>
    </div>
  );
}
