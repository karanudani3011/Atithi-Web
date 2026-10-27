import React from 'react';

export default function TravelerAnimation() {
  return (
    <div className="spx-walker">
      <div className="spx-scaler">
        <div className="spx-enter">
<svg className="spx-pose spx-side" viewBox="0 0 240 300" role="img" aria-label="Traveller with a red suitcase walking to the hotel">
      <ellipse cx="112" cy="295" rx="84" ry="5" fill="#000" opacity=".4"/>
      <g className="spx-bobg">
        <g className="spx-case"><g transform="rotate(10 45 288)">
          <path d="M36 204V162M54 204V162" stroke="#b9c0cd" strokeWidth="3.5" strokeLinecap="round"/>
          <rect x="31" y="157" width="28" height="7" rx="3.5" fill="#e6e9f0"/>
          <rect x="17" y="204" width="56" height="80" rx="10" fill="url(#csr)"/>
          <path d="M29 212v64M41 212v64M53 212v64M65 212v64" stroke="#8c1816" strokeWidth="2.6" strokeLinecap="round" opacity=".55"/>
          <rect x="17" y="204" width="56" height="80" rx="10" fill="none" stroke="#f4736b" strokeWidth="1.6"/>
          <rect x="35" y="197" width="20" height="9" rx="4" fill="#7a1917"/>
          <path d="M17 218h56M17 272h56" stroke="#d4a437" strokeWidth="2.5"/>
          <circle cx="58" cy="245" r="7" fill="#f2c94c"/>
          <path d="M58 240l1.6 3.4 3.7.4-2.7 2.5.8 3.7-3.4-1.9-3.4 1.9.8-3.7-2.7-2.5 3.7-.4z" fill="#b8860b"/>
          <circle cx="30" cy="288" r="5.5" fill="#1d2027"/><circle cx="62" cy="288" r="5.5" fill="#1d2027"/>
          <circle cx="30" cy="288" r="2" fill="#9aa0aa"/><circle cx="62" cy="288" r="2" fill="#9aa0aa"/>
        </g></g>

        {/*  far arm holding the handle  */}
        <path d="M112 93L97 134" stroke="#b9801a" strokeWidth="15" strokeLinecap="round"/>
        <path d="M97 134L76 156" stroke="#b9801a" strokeWidth="13" strokeLinecap="round"/>
        <path d="M76 156L71 161" stroke="#1b2f5e" strokeWidth="13" strokeLinecap="round"/>
        <circle cx="67" cy="164" r="6.5" fill="#d99a6c"/>

        {/*  far leg  */}
        <g className="spx-thF"><path d="M101 148Q119 143 137 148L133 210Q119 214 106 210Z" fill="#15294f"/>
          <g className="spx-shF"><path d="M106 206Q119 211 133 206L129 268Q119 271 110 268Z" fill="#15294f"/>
            <rect x="108" y="250" width="22" height="8" rx="3" fill="#2d4f90"/>
            <path d="M109 266H129L130 274C143 275 155 280 157 288C157 292 154 293 150 293H110C106 293 105 289 107 285Z" fill="#dfe4ee"/>
            <path d="M106 291H156" stroke="#bda35e" strokeWidth="3.5" strokeLinecap="round"/>
          </g></g>

        {/*  backpack  */}
        <rect x="76" y="82" width="28" height="66" rx="12" fill="url(#bpk)"/>
        <path d="M80 108H102" stroke="#3b4f8a" strokeWidth="1.6"/>
        <rect x="77" y="118" width="12" height="22" rx="5" fill="#16224a"/>
        <circle cx="95" cy="108" r="1.8" fill="#d4a437"/>
        <path d="M82 86Q90 80 100 84" stroke="#0f1836" strokeWidth="3" fill="none" strokeLinecap="round"/>

        {/*  jacket  */}
        <path d="M99 88C106 80 126 80 134 90C139 102 138 128 136 152H99C97 128 97 102 99 88Z" fill="url(#jkt)"/>
        <path d="M127 84C133 90 136 100 136 112L135 150H128C130 128 130 104 127 84Z" fill="#fbfaf6"/>
        <path d="M127 86V150" stroke="#8c5d0c" strokeWidth="1.4"/>
        <path d="M99 90C97 110 98 130 99 150H108C106 128 106 108 108 88Z" fill="#b9801a" opacity=".35"/>
        <path d="M112 128L121 134" stroke="#a8700f" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M104 86C110 100 112 124 108 146" stroke="#1f2f5c" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <rect x="104" y="116" width="7" height="5" rx="1.5" fill="#d4a437"/>
        <rect x="97" y="146" width="42" height="9" rx="4.5" fill="#1b2f5e"/>
        <path d="M105 84Q118 98 134 86V93Q118 106 105 92Z" fill="#1b2f5e"/>

        {/*  near leg  */}
        <g className="spx-thN"><path d="M101 148Q119 143 137 148L133 210Q119 214 106 210Z" fill="url(#pnt)"/>
          <path d="M112 156L116 200" stroke="#12264d" strokeWidth="1.2" opacity=".35"/>
          <g className="spx-shN"><path d="M106 206Q119 211 133 206L129 268Q119 271 110 268Z" fill="url(#pnt)"/>
            <rect x="108" y="250" width="22" height="8" rx="3" fill="#3d63a8"/>
            <rect x="111" y="259" width="16" height="8" fill="#d99a6c"/>
            <path d="M109 266H129L130 274C143 275 155 280 157 288C157 292 154 293 150 293H110C106 293 105 289 107 285Z" fill="#f7f8fb" stroke="#cdd3e0" strokeWidth="1"/>
            <path d="M138 276C148 278 154 282 156 288H140Z" fill="#fff"/>
            <path d="M120 268l7 4M118 272l7 4" stroke="#aab4cc" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M106 291H156" stroke="#e1cf9f" strokeWidth="4" strokeLinecap="round"/>
            <path d="M108 289H154" stroke="#d4a437" strokeWidth="1.4"/>
          </g></g>

        {/*  neck + head  */}
        <path d="M116 66H129L131 88H113Z" fill="#d99a6c"/>
        <g transform="translate(125 73) scale(.86) translate(-125 -73)">
          <path d="M113 38C122 34 133 37 136 46L137 49C138 51 141 54 142 56C142 58 139 59 137 59L138 61L136.5 63L138 65C138 69 135 72 130 73C124 74 117 70 113 64Z" fill="url(#skn)"/>
          <path d="M110 62C103 44 108 28 124 27C138 26 146 36 142 45C139 40 134 37 127 38C119 39 115 46 116 62Z" fill="#241510"/>
          <path d="M126 28C134 19 148 24 146 36C142 31 135 29 126 28Z" fill="#33201a"/>
          <path d="M113 34Q122 28 134 32" stroke="#5a3a28" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8"/>
          <ellipse cx="116" cy="55" rx="3.8" ry="6" fill="#e5ab80"/><path d="M115.5 52Q118 55 115.5 58" stroke="#c98a5c" strokeWidth="1.2" fill="none"/>
          <path d="M125 44Q131 41 137 44" stroke="#241510" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <g className="spx-eye"><ellipse cx="131" cy="50" rx="3.2" ry="3.5" fill="#fff"/><circle cx="132" cy="50.4" r="2.3" fill="#4a2b14"/><circle cx="132.3" cy="50.5" r="1.2" fill="#120a05"/><circle cx="133" cy="49.4" r=".8" fill="#fff"/>
            <path d="M127.6 48.8Q131.4 46 135 48.6" stroke="#120a05" strokeWidth="1.5" fill="none" strokeLinecap="round"/></g>
          <path d="M133 66Q137 69 141 64" stroke="#a24a3a" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
          <circle cx="127" cy="60" r="4.5" fill="#f08e7a" opacity=".33"/>
        </g>

        {/*  near arm swinging  */}
        <g className="spx-armN"><path d="M109 90Q119 84 128 92L126 138Q118 142 111 138Z" fill="url(#jkt)"/>
          <g className="spx-foreN"><path d="M111 132Q118 136 126 132L124 166Q118 169 113 166Z" fill="url(#jkt)"/>
            <rect x="111" y="160" width="14" height="8" rx="3" fill="#1b2f5e"/>
            <ellipse cx="118" cy="177" rx="6.5" ry="9" fill="url(#skn)"/>
          </g></g>
      </g>
    </svg>
<svg className="spx-pose spx-back" viewBox="0 0 240 300" aria-hidden="true">
      <defs><g id="bkLeg">
        <path d="M89 148Q104 144 119 148L117 210L115 270Q104 273 94 270L92 210Z" fill="url(#pnt)"/>
        <path d="M104 152V250" stroke="#12264d" strokeWidth="1.2" opacity=".4"/>
        <rect x="92" y="252" width="25" height="8" rx="3" fill="#3d63a8"/>
        <path d="M91 266H118L120 280C120 290 117 293 112 293H97C92 293 90 290 90 280Z" fill="#f7f8fb" stroke="#cdd3e0" strokeWidth="1"/>
        <path d="M98 267V276M110 267V276" stroke="#c4cbdb" strokeWidth="1.5"/>
        <path d="M90 289H120" stroke="#d4a437" strokeWidth="3.5" strokeLinecap="round"/>
      </g></defs>
      <ellipse cx="120" cy="295" rx="66" ry="5" fill="#000" opacity=".4"/>
      <g className="spx-bobg">
        <g className="spx-lgL"><use href="#bkLeg"/></g>
        <g className="spx-lgR"><use href="#bkLeg" x="32"/></g>

        <g className="spx-caseB">
          <path d="M164 204V170M180 204V170" stroke="#b9c0cd" strokeWidth="3.5" strokeLinecap="round"/>
          <rect x="158" y="166" width="28" height="7" rx="3.5" fill="#e6e9f0"/>
          <rect x="147" y="204" width="50" height="80" rx="9" fill="url(#csr)"/>
          <path d="M158 212v64M170 212v64M182 212v64" stroke="#8c1816" strokeWidth="2.6" strokeLinecap="round" opacity=".55"/>
          <rect x="147" y="204" width="50" height="80" rx="9" fill="none" stroke="#f4736b" strokeWidth="1.6"/>
          <rect x="161" y="197" width="22" height="9" rx="4" fill="#7a1917"/>
          <path d="M147 218h50M147 272h50" stroke="#d4a437" strokeWidth="2.5"/>
          <circle cx="160" cy="288" r="5.5" fill="#1d2027"/><circle cx="184" cy="288" r="5.5" fill="#1d2027"/>
        </g>

        {/*  jacket back + backpack  */}
        <path d="M80 100C82 86 100 80 120 80C140 80 158 86 160 100L156 152H84Z" fill="url(#jkt)"/>
        <path d="M120 96V150" stroke="#a8700f" strokeWidth="1.5" opacity=".45"/>
        <path d="M104 82Q120 94 136 82V89Q120 101 104 89Z" fill="#1b2f5e"/>
        <rect x="82" y="146" width="76" height="9" rx="4.5" fill="#1b2f5e"/>
        <rect x="93" y="92" width="54" height="54" rx="14" fill="url(#bpk)"/>
        <path d="M96 112H144" stroke="#3b4f8a" strokeWidth="1.8"/>
        <rect x="93" y="118" width="11" height="22" rx="5" fill="#16224a"/><rect x="136" y="118" width="11" height="22" rx="5" fill="#16224a"/>
        <rect x="108" y="120" width="24" height="20" rx="6" fill="#19264d" stroke="#2c3f75" strokeWidth="1.5"/>
        <circle cx="120" cy="108" r="2" fill="#d4a437"/>
        <path d="M110 92Q120 82 130 92" stroke="#0f1836" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

        {/*  left arm swinging  */}
        <g className="spx-armL"><path d="M76 98Q84 88 94 98L90 142Q83 147 77 141Z" fill="url(#jkt)"/>
          <path d="M77 138Q84 143 91 138L90 168Q83 171 78 168Z" fill="url(#jkt)"/>
          <rect x="77" y="162" width="14" height="8" rx="3" fill="#1b2f5e"/>
          <ellipse cx="84" cy="178" rx="6.5" ry="8.5" fill="#e5ab80"/></g>

        {/*  neck + head from behind  */}
        <rect x="112" y="64" width="16" height="22" rx="6" fill="#d99a6c"/>
        <ellipse cx="120" cy="50" rx="19" ry="20" fill="url(#skn)"/>
        <path d="M101 52C98 34 108 28 120 28C132 28 142 34 139 52C138 60 134 64 130 66H110C106 64 102 60 101 52Z" fill="#241510"/>
        <path d="M108 62Q120 74 132 62L131 68H109Z" fill="#4a2c1c" opacity=".55"/>
        <path d="M110 38Q120 30 130 38M114 46Q120 40 126 46" stroke="#4a2d1d" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <ellipse cx="100.5" cy="52" rx="3.5" ry="6" fill="#e5ab80"/><ellipse cx="139.5" cy="52" rx="3.5" ry="6" fill="#e5ab80"/>

        {/*  right arm on the suitcase handle  */}
        <path d="M156 98L167 138" stroke="#c98d1c" strokeWidth="15" strokeLinecap="round"/>
        <path d="M167 138L171 164" stroke="#c98d1c" strokeWidth="13" strokeLinecap="round"/>
        <path d="M171 164L172 168" stroke="#1b2f5e" strokeWidth="13" strokeLinecap="round"/>
        <circle cx="172" cy="172" r="7" fill="#e5ab80"/>
      </g>
    </svg>
        </div>
      </div>
    </div>
  );
}
