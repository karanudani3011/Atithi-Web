const photo=(id)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=82`;
export const rooms=[
{id:1,name:'Deluxe Room',type:'Deluxe',price:3999,size:28,guests:2,rating:4.7,description:'A calm, beautifully appointed retreat for a restful city stay.',image:photo('photo-1611892440504-42a792e24d32'),amenities:['King bed','City view','Rain shower','Smart TV']},
{id:2,name:'Executive Room',type:'Deluxe',price:4999,size:34,guests:2,rating:4.8,description:'Extra room to unwind, with thoughtful details and a work nook.',image:photo('photo-1590490360182-c33d57733427'),amenities:['King bed','Work desk','Lounge chair','Minibar']},
{id:3,name:'Premium Suite',type:'Suite',price:7499,size:52,guests:3,rating:4.8,description:'A generous suite with a separate lounge and a view worth lingering over.',image:photo('photo-1591088398332-8a7791972843'),amenities:['Separate lounge','King bed','Soaking tub','Breakfast']},
{id:4,name:'Family Room',type:'Family',price:5499,size:48,guests:4,rating:4.6,description:'Room for everyone, with flexible sleeping and easy family comforts.',image:photo('photo-1566665797739-1674de7a421a'),amenities:['Twin + king','Family lounge','Kids welcome','Breakfast']},
{id:5,name:'Royal Suite',type:'Suite',price:12999,size:80,guests:4,rating:4.9,description:'A statement stay pairing gracious space with a little royal flourish.',image:photo('photo-1616486338812-3dadae4b4ace'),amenities:['Butler service','Dining area','Soaking tub','Lounge']},
{id:6,name:'Presidential Villa',type:'Villa',price:19999,size:140,guests:6,rating:5.0,description:'Your own private haven, with serene outdoor space and every comfort.',image:photo('photo-1613977257363-707ba9348227'),amenities:['Private pool','Garden','Butler service','Dining room']}
];
