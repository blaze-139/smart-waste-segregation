/**
 * Smart Waste Segregation Assistant - Master Waste Database
 * Verified guidelines aligned with EPA (Environmental Protection Agency) & Basel Convention standards.
 */

const WASTE_ITEMS = [
  // ==========================================
  // BIODEGRADABLE & ORGANICS (Green Bin / Deep Moss)
  // ==========================================
  {
    id: 'bio-01',
    name: 'Banana peel',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-01',
    disposalMethod: 'Place directly into household compost bin or municipal organic waste cart.',
    prep: [
      'Remove any non-compostable PLU barcode sticker labels',
      'Chop into smaller pieces to accelerate microbial aerobic breakdown'
    ],
    impact: 'Decomposes aerobically into nutrient-rich humus within 3-4 weeks, preventing methane emission in landfills.',
    mistake: 'Do not seal in standard non-compostable polyethylene grocery bags.',
    quote: 'Peel the love, feed the soil humus.'
  },
  {
    id: 'bio-02',
    name: 'Coffee grounds & paper filters',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-02',
    disposalMethod: 'Empty into green organics bin along with unbleached paper filter.',
    prep: [
      'Allow grounds to cool before tossing',
      'Ensure the filter paper is 100% unbleached pulp without nylon weave'
    ],
    impact: 'Adds rich nitrogen, potassium, and magnesium to compost, creating high-grade soil conditioner.',
    mistake: 'Never throw aluminum or plastic single-use coffee pods into the green cart.',
    quote: 'Good coffee fuels your morning; spent grounds fuel the earth.'
  },
  {
    id: 'bio-03',
    name: 'Eggshells',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-03',
    disposalMethod: 'Crush gently and toss into compost bin or garden soil.',
    prep: [
      'Crush coarsely by hand to speed up microbial assimilation',
      'No need to wash away egg white residue'
    ],
    impact: 'Provides slow-release calcium carbonate that neutralizes soil acidity and fortifies root structures.',
    mistake: 'Do not place in plastic egg cartons; paper cartons go into blue or green carts.',
    quote: 'Crack the shell, fertilize the soil.'
  },
  {
    id: 'bio-04',
    name: 'Food-soiled pizza box bottom',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-04',
    disposalMethod: 'Tear off the greasy bottom half and place in green compost cart.',
    prep: [
      'Separate the clean dry cardboard lid from the grease-soaked base',
      'Tear greasy portion into palm-sized strips for faster decomposition'
    ],
    impact: 'Grease and cheese fats break down easily in municipal hot composting facilities (55-65°C).',
    mistake: 'CRITICAL TRAP: Never put grease-saturated cardboard into the blue recycling bin. Oil ruins paper fiber slurries.',
    quote: 'Grease belongs in compost, never in the paper recycling slurry.'
  },
  {
    id: 'bio-05',
    name: 'Fruit & vegetable scraps',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-05',
    disposalMethod: 'Collect in a countertop organic caddy and transfer to green curbside cart.',
    prep: [
      'Peel off price stickers, twist-ties, and rubber bands',
      'Drain excess liquid slurry before dumping'
    ],
    impact: 'Diverting organics from landfills avoids anaerobic methane production (which has 28x global warming potential of CO2).',
    mistake: 'Avoid tossing plastic produce bags into the green bin.',
    quote: 'From salad bowl to soil soul.'
  },
  {
    id: 'bio-06',
    name: 'Yard trimmings & fallen leaves',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-06',
    disposalMethod: 'Fill yard waste paper bags or green municipal yard bins.',
    prep: [
      'Trim thick branches down to under 3 inches in diameter',
      'Do not mix with plastic landscape fabric or weed netting'
    ],
    impact: 'Municipal mulching converts garden cuttings into landscape ground cover and organic compost.',
    mistake: 'Never bag yard waste in petroleum plastic garbage sacks.',
    quote: 'Autumn leaves are nature’s golden blanket.'
  },
  {
    id: 'bio-07',
    name: 'Stale bread & bakery crusts',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-07',
    disposalMethod: 'Place in compost or municipal food waste collection bin.',
    prep: [
      'Remove all plastic bread clips, ties, and plastic wrapper sleeves'
    ],
    impact: 'Breaks down completely within 7-14 days in active compost piles.',
    mistake: 'Do not throw the plastic bag into the compost.',
    quote: 'Even the heel of the bread has an honorable afterlife.'
  },
  {
    id: 'bio-08',
    name: 'Used paper napkins & kitchen paper towels',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-08',
    disposalMethod: 'Toss food-wiped napkins into green compost cart.',
    prep: [
      'Ensure the paper towel was not used with toxic chemical solvents or motor oil',
      'Food residue and water-based spills are 100% compostable'
    ],
    impact: 'Short cellulose fibers break down rapidly and add carbon to balance nitrogen in compost.',
    mistake: 'Paper towels used with bleach or chemical disinfectants belong in regular trash.',
    quote: 'Wipe clean, compost green.'
  },
  {
    id: 'bio-09',
    name: 'Tea bags (pure paper & string)',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-09',
    disposalMethod: 'Place unbleached natural tea bags into the green bin.',
    prep: [
      'Check that the bag is not made of pyramid nylon mesh or polyester',
      'Remove metal staple if present'
    ],
    impact: 'Leaves enrich soil with tannic acid and organic matter.',
    mistake: 'Synthetic plastic pyramid tea bags do not degrade and release billions of microplastics.',
    quote: 'Steep, sip, compost.'
  },
  {
    id: 'bio-10',
    name: 'Wooden toothpicks & chopsticks',
    category: 'biodegradable',
    binColor: 'Green Bin (Compost / Organics)',
    streamCode: 'STREAM-ORG-10',
    disposalMethod: 'Toss unvarnished natural wood utensils into compost.',
    prep: [
      'Ensure chopsticks are untreated plain bamboo/wood without lacquer or plastic coating'
    ],
    impact: 'Biodegrades naturally into organic carbon matter within a few months.',
    mistake: 'Plastic toothpicks with dental floss belong in landfill trash.',
    quote: 'Natural timber returns to timber soil.'
  },

  // ==========================================
  // DRY RECYCLABLES (Blue Cart / Ocean Blue)
  // ==========================================
  {
    id: 'rec-01',
    name: 'Plastic water bottle',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-01',
    disposalMethod: 'Empty liquids completely, crush lightly, and place into dry recycling cart.',
    prep: [
      'Empty all residual liquid completely (liquids spoil paper in mixed recycling)',
      'Leave the cap screwed on tightly (caps are recovered through float-sink tanks)'
    ],
    impact: 'Recycling PET (#1) saves up to 88% of manufacturing energy compared to virgin petroleum synthesis.',
    mistake: 'Do not bag recyclables in opaque black trash bags; keep them loose in the cart.',
    quote: 'Wait, it’s all recyclable? Always has been.'
  },
  {
    id: 'rec-02',
    name: 'Aluminum beverage can',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-02',
    disposalMethod: 'Rinse out sticky soda residue and place in blue bin.',
    prep: [
      'Rinse lightly to prevent pest attraction and sugar mold at the recovery facility',
      'Leave the pull-tab attached to the can body'
    ],
    impact: 'Aluminum is infinitely recyclable. Melting recycled cans saves 95% of primary bauxite smelting energy.',
    mistake: 'Do not crush cans flat if your municipality uses single-stream optical sorting.',
    quote: 'A recycled can can be back on the store shelf in just 60 days.'
  },
  {
    id: 'rec-03',
    name: 'Cardboard box',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-03',
    disposalMethod: 'Flatten completely and place inside blue paper and cardboard recycling cart.',
    prep: [
      'Remove packing peanuts, bubble wrap, and styrofoam inserts',
      'Break down and flatten boxes to maximize collection truck space'
    ],
    impact: 'Recycling 1 ton of cardboard saves 17 mature trees, 7,000 gallons of water, and 4,000 kWh of electricity.',
    mistake: 'Never put wet, moldy, or greasy cardboard into the recycling bin.',
    quote: 'Break it down so the planet stays up.'
  },
  {
    id: 'rec-04',
    name: 'Clean cardboard pizza box lid',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-04',
    disposalMethod: 'Tear off the ungreased, clean top lid and place in blue cart.',
    prep: [
      'Inspect for oil seepage; only clean, oil-free cardboard can be repulped',
      'Put the soiled bottom half into the compost bin'
    ],
    impact: 'High-grade corrugated paper pulp is recovered to make new clean packaging.',
    mistake: 'Tossing the whole box with pizza crusts contaminates entire recycling bales.',
    quote: 'Halve the box, double the diversion.'
  },
  {
    id: 'rec-05',
    name: 'Glass beverage bottle & jars',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-05',
    disposalMethod: 'Rinse cleanly and place in designated blue glass container cart.',
    prep: [
      'Rinse away food and sauce residue',
      'Remove metal lids and recycle them separately in the same cart'
    ],
    impact: 'Glass can be recycled infinitely without loss of purity or structural integrity.',
    mistake: 'Never put broken window glass, Pyrex baking dishes, or mirrors in recycling.',
    quote: 'Clear, green, or amber: glass lives forever.'
  },
  {
    id: 'rec-06',
    name: 'Tin & steel food cans',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-06',
    disposalMethod: 'Rinse soup or tuna cans clean and place in blue cart.',
    prep: [
      'Rinse sauce residue',
      'Tuck detached lid safely inside the can and crimp top slightly so it does not fall out'
    ],
    impact: 'Magnetic separation at MRFs recovers 100% of steel cans with 74% energy savings.',
    mistake: 'Do not toss paint cans or aerosol cans with residual propellant into blue carts.',
    quote: 'Magnetic magic: steel always finds its way back.'
  },
  {
    id: 'rec-07',
    name: 'HDPE milk jug (#2 plastic)',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-07',
    disposalMethod: 'Rinse thoroughly with cold water, replace cap, and place in blue bin.',
    prep: [
      'Rinse to prevent curdled milk odors',
      'Flatten jug lightly to save bin volume'
    ],
    impact: 'HDPE is pellets are converted into durable composite lumber, drainage pipes, and detergent bottles.',
    mistake: 'Do not remove label using harsh chemicals; MRFs wash them off automatically.',
    quote: 'Milk jugs today, park benches tomorrow.'
  },
  {
    id: 'rec-08',
    name: 'Office paper & newspapers',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-08',
    disposalMethod: 'Keep dry and flat in paper recycling container.',
    prep: [
      'Remove plastic sleeves and spiral metal bindings',
      'Small staples are acceptable and extracted magnetically during pulping'
    ],
    impact: 'Repulped paper saves 60% of manufacturing energy and drastically reduces industrial water consumption.',
    mistake: 'Shredded paper should be contained in a clear bag or paper bag per local city rules.',
    quote: 'Every printed sheet deserves a second edition.'
  },
  {
    id: 'rec-09',
    name: 'Shampoo & conditioner bottles',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-09',
    disposalMethod: 'Pump out remaining soap, rinse quickly, and recycle.',
    prep: [
      'Rinse out suds',
      'Remove pump mechanisms with metal springs (pumps go in landfill trash)'
    ],
    impact: 'Keeps high-density polyethylene and polypropylene in circular domestic manufacturing.',
    mistake: 'Do not leave heavy lotions or conditioner sludge inside.',
    quote: 'Lather, rinse, recycle.'
  },
  {
    id: 'rec-10',
    name: 'Aluminum foil & pie pans',
    category: 'recyclable',
    binColor: 'Blue Cart (Recyclables)',
    streamCode: 'STREAM-REC-10',
    disposalMethod: 'Wipe clean of baked food, ball up to at least 2 inches, and place in blue cart.',
    prep: [
      'Foil must be clean of heavy cheese or grease',
      'Crumple multiple pieces into a firm ball so optical sorters do not mistake it for paper'
    ],
    impact: 'High-purity aluminum melts back into clean industrial ingots.',
    mistake: 'Tiny flakes of foil get blown into paper streams and contaminate bales.',
    quote: 'Roll it into a fist-sized ball and send it to the furnace.'
  },

  // ==========================================
  // HOUSEHOLD HAZARDOUS WASTE (Red Depot / Terracotta)
  // ==========================================
  {
    id: 'haz-01',
    name: 'Lithium-ion batteries',
    category: 'hazardous',
    binColor: 'Special Hazardous Waste Depot / Battery Box',
    streamCode: 'STREAM-HAZ-01',
    disposalMethod: 'Insulate terminals with clear tape; drop off at certified municipal collection kiosk.',
    prep: [
      'Wrap both terminal contacts (+ and -) with clear electrical tape',
      'Store in a non-conductive plastic container until transport',
      'Never attempt to puncture, crush, or submerge in water'
    ],
    impact: 'Recovers 99% of lithium, cobalt, and nickel while preventing dangerous compactor fires and heavy-metal aquifer poisoning.',
    mistake: 'CRITICAL HAZARD: Never toss in curbside blue or black carts. Waste truck compactors crush them, triggering explosive chemical fires.',
    quote: 'One does not simply throw batteries in the regular trash.'
  },
  {
    id: 'haz-02',
    name: 'Bleach & chemical disinfectants',
    category: 'hazardous',
    binColor: 'Red Special Depot (Hazardous Chemicals)',
    streamCode: 'STREAM-HAZ-02',
    disposalMethod: 'Deliver in original tightly sealed bottle to municipal Household Hazardous Waste center.',
    prep: [
      'Keep in original container with manufacturer hazard warning label intact',
      'Ensure safety cap is firmly tightened',
      'Transport upright in a cardboard box'
    ],
    impact: 'Neutralized professionally in treatment plants to prevent toxic aquatic biocide discharge.',
    mistake: 'NEVER mix with ammonia, vinegar, or acidic cleaners (generates deadly chlorine gas).',
    quote: 'One does not simply throw chemicals in the regular trash.'
  },
  {
    id: 'haz-03',
    name: 'Fluorescent CFL & tube bulbs',
    category: 'hazardous',
    binColor: 'Red Special Depot / Retail Takeback',
    streamCode: 'STREAM-HAZ-03',
    disposalMethod: 'Carefully box without breaking and bring to retail drop-off (e.g. hardware store) or HHW kiosk.',
    prep: [
      'Handle with care to prevent glass shattering',
      'If broken, air out room for 15 minutes and scoop into a sealed jar with cardboard'
    ],
    impact: 'Prevents toxic elemental mercury vapor from escaping into residential atmosphere and waterways.',
    mistake: 'Never put fluorescent tubes in curbside recycling bins.',
    quote: 'Mercury shines bright in bulbs, but poisons the soil.'
  },
  {
    id: 'haz-04',
    name: 'Used motor engine oil & filters',
    category: 'hazardous',
    binColor: 'Red Special Depot / Certified Auto Center',
    streamCode: 'STREAM-HAZ-04',
    disposalMethod: 'Pour into a clean, sealed jug and drop off at auto service station or county depot.',
    prep: [
      'Never mix with antifreeze, gasoline, or water',
      'Keep in clean leak-proof container'
    ],
    impact: '1 gallon of motor oil can re-refine into 2.5 quarts of fresh lubricating oil, saving crude drilling.',
    mistake: 'Dumping oil in storm drains contaminates 1 million gallons of fresh drinking water.',
    quote: 'Oil belongs in the engine, never down the storm drain.'
  },
  {
    id: 'haz-05',
    name: 'Oil-based paint & paint thinners',
    category: 'hazardous',
    binColor: 'Red Special Depot / PaintCare Site',
    streamCode: 'STREAM-HAZ-05',
    disposalMethod: 'Take liquid paint cans to county hazardous drop-off or certified PaintCare kiosk.',
    prep: [
      'Ensure lid is hammered down securely',
      'If latex paint is completely dried solid, can be disposed in trash (check local rules)'
    ],
    impact: 'Solvents and volatile organic compounds (VOCs) are safely incinerated under high-temperature scrubbers.',
    mistake: 'Never pour paint thinners, turpentine, or mineral spirits down household drains.',
    quote: 'Protect your pipes, protect your planet.'
  },
  {
    id: 'haz-06',
    name: 'Pesticides, weedkiller & insecticides',
    category: 'hazardous',
    binColor: 'Red Special Depot (Toxic Stream)',
    streamCode: 'STREAM-HAZ-06',
    disposalMethod: 'Hand deliver to municipal toxic chemical disposal facility.',
    prep: [
      'Keep in original container with active ingredient labels readable',
      'Do not triple rinse and dump rinse-water down sewer lines'
    ],
    impact: 'Prevents acute ecosystem damage, bee colony collapse, and bioaccumulation in food chains.',
    mistake: 'Never place half-full pesticide bottles in residential trash carts.',
    quote: 'Handle with gloves, dispose with care.'
  },
  {
    id: 'haz-07',
    name: 'Car batteries (Lead-Acid)',
    category: 'hazardous',
    binColor: 'Automotive Store Exchange / Scrap Depot',
    streamCode: 'STREAM-HAZ-07',
    disposalMethod: 'Return to auto parts retailer for core deposit refund or scrap depot.',
    prep: [
      'Inspect for battery case cracking or sulfuric acid leaks',
      'Transport strictly upright in an acid-resistant plastic tote'
    ],
    impact: '99% closed-loop circularity: lead and plastic cases are 100% recycled into new vehicle batteries.',
    mistake: 'Never tilt sideways; sulfuric acid burns skin and corrodes metal rapidly.',
    quote: 'Heaviest battery, highest closed-loop recycling rate in the world.'
  },
  {
    id: 'haz-08',
    name: 'Expired medications & prescription pills',
    category: 'hazardous',
    binColor: 'Pharmacy Take-Back MedSafe Kiosk',
    streamCode: 'STREAM-HAZ-08',
    disposalMethod: 'Drop into secure MedSafe drug return box located in pharmacy lobbies.',
    prep: [
      'Cross out personal prescription name on the label for privacy',
      'Keep pills in original blister pack or prescription bottle'
    ],
    impact: 'Prevents antibiotics and endocrine-disrupting hormones from entering public water supplies.',
    mistake: 'NEVER flush prescription drugs down the toilet or kitchen sink.',
    quote: 'Keep drugs out of fish streams and sewer pipes.'
  },
  {
    id: 'haz-09',
    name: 'Mercury fever thermometer',
    category: 'hazardous',
    binColor: 'Red Special Depot (Hazardous Waste)',
    streamCode: 'STREAM-HAZ-09',
    disposalMethod: 'Place in a cushioned, hard plastic container and deliver to county HHW facility.',
    prep: [
      'Wrap in bubble wrap to prevent accidental glass breakage',
      'Identify by silver metallic liquid inside the capillary tube'
    ],
    impact: 'Metallic mercury is safely distilled and isolated from biosphere entry.',
    mistake: 'Never discard in municipal trash; vacuuming a broken thermometer vaporizes mercury instantly.',
    quote: 'Old school mercury needs modern hazardous isolation.'
  },
  {
    id: 'haz-10',
    name: 'Aerosol spray cans (full / pressurized)',
    category: 'hazardous',
    binColor: 'Red Special Depot (Pressurized Gases)',
    streamCode: 'STREAM-HAZ-10',
    disposalMethod: 'Take partially full pressurized aerosols to hazardous depot.',
    prep: [
      'Do not attempt to puncture or burn pressurized cans',
      'Only 100% empty, depressurized steel aerosol cans can go to blue carts'
    ],
    impact: 'Prevents explosive fireball incidents in compactor hoppers and shredder lines.',
    mistake: 'Tossing pressurized propellant cans into trash compactor causes catastrophic facility explosions.',
    quote: 'Under pressure: treat with respect.'
  },

  // ==========================================
  // ELECTRONIC WASTE (Slate Depot / Deep Taupe)
  // ==========================================
  {
    id: 'ew-01',
    name: 'Smartphone',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Certified Takeback',
    streamCode: 'STREAM-EWT-01',
    disposalMethod: 'Factory wipe personal data and drop off at certified electronics recycling center.',
    prep: [
      'Perform factory data reset and log out of cloud accounts',
      'Remove SIM card and microSD memory cards',
      'Remove silicone or leather phone case'
    ],
    impact: '1 ton of smartphones contains 300 times more gold than 1 ton of high-grade gold ore from a mine.',
    mistake: 'Never place with general household trash or curbside recycling.',
    quote: 'Your old pocket supercomputer is a gold mine in disguise.'
  },
  {
    id: 'ew-02',
    name: 'Laptop computer & chargers',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / E-Stewards Facility',
    streamCode: 'STREAM-EWT-02',
    disposalMethod: 'Take to certified e-waste recycler, municipal drop-off day, or electronics retailer.',
    prep: [
      'Back up important files and securely wipe storage SSD/HDD',
      'Bundle power supply brick and charging cord together'
    ],
    impact: 'Recovers valuable copper, palladium, neodymium magnets, and aluminum heat sinks.',
    mistake: 'Never smash screen or puncture built-in battery pack.',
    quote: 'Retire your silicon warrior with dignity.'
  },
  {
    id: 'ew-03',
    name: 'Television monitor & LED display',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Bulk Electronic Kiosk',
    streamCode: 'STREAM-EWT-03',
    disposalMethod: 'Schedule curbside e-waste pickup or bring to designated electronics warehouse.',
    prep: [
      'Keep glass panel intact to prevent phosphor and glass splinter hazards',
      'Tape power cord neatly to the back panel'
    ],
    impact: 'Recovers high-purity circuit boards and prevents leaded glass leaching.',
    mistake: 'Curbside trash trucks will crush and reject CRT / flat panel displays.',
    quote: 'Screen off, circular loop on.'
  },
  {
    id: 'ew-04',
    name: 'Power adapters, chargers & USB cables',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Retail Cable Bin',
    streamCode: 'STREAM-EWT-04',
    disposalMethod: 'Drop into electronics recycling bins at retail stores (Best Buy, Staples, etc.).',
    prep: [
      'Coil cables loosely and secure with paper twist tie'
    ],
    impact: 'Copper wire inside cables is granulated and recovered with 99% smelting purity.',
    mistake: 'CRITICAL TRAP: Cables are "tanglers" in recycling plants. They wrap around sorting spinning disks and halt plant operations.',
    quote: 'Tanglers shut down recycling facilities. Take them to the e-box!'
  },
  {
    id: 'ew-05',
    name: 'Microwave oven & small appliances',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Scrap Metal Takeback',
    streamCode: 'STREAM-EWT-05',
    disposalMethod: 'Drop off at municipal small-appliance collection or scrap metal depot.',
    prep: [
      'Remove glass turntable tray (tray is tempered glass: put in regular trash if broken)',
      'Unplug and coil electrical cord'
    ],
    impact: 'High-voltage transformer and steel chassis provide high-value scrap steel and heavy copper windings.',
    mistake: 'Do not place inside curbside recycling carts.',
    quote: 'Microwaved its last burrito? Time for the e-waste hub.'
  },
  {
    id: 'ew-06',
    name: 'Computer keyboard & optical mouse',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Retail Electronics Box',
    streamCode: 'STREAM-EWT-06',
    disposalMethod: 'Place in electronic accessory collection box.',
    prep: [
      'Remove AA or AAA batteries from wireless devices and recycle batteries in hazardous box',
      'Wipe off surface dirt'
    ],
    impact: 'Circuit membrane and ABS plastic enclosures are shredded and sorted with optical near-infrared.',
    mistake: 'Do not leave leaking alkaline batteries inside wireless mice.',
    quote: 'Click into circularity.'
  },
  {
    id: 'ew-07',
    name: 'Ink & toner printer cartridges',
    category: 'ewaste',
    binColor: 'Office Retail Take-Back / Manufacturer Mail-In',
    streamCode: 'STREAM-EWT-07',
    disposalMethod: 'Return to office supply store or use prepaid manufacturer mail-in bag.',
    prep: [
      'Place in sealed plastic bag so residual powdered toner or ink does not stain',
      'Do not attempt to wash toner with hot water'
    ],
    impact: 'Cartridges are refilled up to 5 times or remolded into engineering plastics.',
    mistake: 'Throwing toner into trash releases fine particulate micro-pigments into air.',
    quote: 'Return the toner, save the print.'
  },
  {
    id: 'ew-08',
    name: 'Tablets & e-readers',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Certified Takeback',
    streamCode: 'STREAM-EWT-08',
    disposalMethod: 'Bring to certified electronics drop-off location or trade-in program.',
    prep: [
      'Erase device back to factory default state',
      'Include charging cable if donating for reuse'
    ],
    impact: 'Rare earth elements like neodymium, dysprosium, and praseodymium are recovered.',
    mistake: 'Do not throw in general trash where compactor fires can ignite the battery.',
    quote: 'Turn the final page on your e-reader sustainably.'
  },
  {
    id: 'ew-09',
    name: 'Smart watches & fitness bands',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Small WEEE Bin',
    streamCode: 'STREAM-EWT-09',
    disposalMethod: 'Take to electronic drop box or electronics retailer trade-in.',
    prep: [
      'Detach silicone or fabric wristband (silicone goes to trash; device goes to e-waste)',
      'Unpair from smartphone'
    ],
    impact: 'Recovers miniature lithium-polymer cells, optical sensors, and micro-antennas.',
    mistake: 'Never put in curbside bins.',
    quote: 'Count steps towards zero waste.'
  },
  {
    id: 'ew-10',
    name: 'Gaming console & controllers',
    category: 'ewaste',
    binColor: 'Slate E-Waste Depot / Retail Trade-In',
    streamCode: 'STREAM-EWT-10',
    disposalMethod: 'Drop at electronics recycling facility or game store trade-in.',
    prep: [
      'Format internal hard drive to wipe payment details and profile info',
      'Remove disc from optical drive'
    ],
    impact: 'High-performance copper heatsinks, graphics silicon, and circuitry are refined.',
    mistake: 'Do not discard in curbside recycling bins.',
    quote: 'Game Over for the console, Level 1 for the circular economy.'
  }
];

// Detailed Temporal Persistence Scale (12 Chronological Degradation Milestones)
const DEGRADE_STEPS = [
  {
    id: 'step-0',
    name: 'Apple Core & Organic Scraps',
    duration: '2 to 4 Weeks',
    hazard: 'Minimal (Aerobic Decomposition)',
    energy: '98% Humus Soil Nutrient Yield',
    stream: 'Green Cart (Compost / Organics)',
    desc: 'Rapidly assimilated by naturally occurring aerobes, actinomycetes, and earthworms in composting soils. Aerobic digestion produces zero methane.',
    visualType: 'organic',
    badge: 'BIO-GEO-01',
    halfLifeYears: 0.08,
    microplasticRisk: 'Zero',
    recoveryRate: '100% Bio-Nutrient Humus'
  },
  {
    id: 'step-1',
    name: 'Clean Cardboard Packaging Box',
    duration: '2 Months',
    hazard: 'Low (If unsoiled with petroleum or grease)',
    energy: '75% Manufacturing Energy Saved',
    stream: 'Blue Cart (Clean Paper & Board)',
    desc: 'Pure cellulosic wood pulp fibers break down under soil moisture and microbial cellulase enzymes. Can be mechanically repulped up to 7 times before fiber breakdown.',
    visualType: 'paper',
    badge: 'BIO-GEO-02',
    halfLifeYears: 0.17,
    microplasticRisk: 'Zero',
    recoveryRate: '88% Fiber Reclamation'
  },
  {
    id: 'step-2',
    name: 'Cotton Fabric & Wool Garments',
    duration: '1 to 5 Years',
    hazard: 'Low (Cellulosic & Keratin Fibers)',
    energy: '80% Water & Agriculture Saved',
    stream: 'Textile Collection / Green Bin',
    desc: 'Natural plant and animal fibers unravel through rainfall and soil enzymes. Unlike synthetic polyester, cotton produces no microplastics during degradation.',
    visualType: 'cotton',
    badge: 'BIO-GEO-03',
    halfLifeYears: 3,
    microplasticRisk: 'Zero (Natural Fibers)',
    recoveryRate: '70% Shoddy / Insulation'
  },
  {
    id: 'step-3',
    name: 'Cigarette Filters (Cellulose Acetate)',
    duration: '10 to 12 Years',
    hazard: 'High (Nicotine, Heavy Metals, Acetate)',
    energy: '95% Toxic Leaching Hazard',
    stream: 'Landfill / Dedicated TerraCycle Bin',
    desc: 'Filters are made of cellulose acetate plastic, NOT paper. A single discarded butt sheds thousands of microfibers and leaches nicotine, lead, and arsenic into runoff.',
    visualType: 'cigarette',
    badge: 'BIO-GEO-04',
    halfLifeYears: 11,
    microplasticRisk: 'Severe Synthetic Fibers',
    recoveryRate: 'Specialized Chemical Pyrolysis'
  },
  {
    id: 'step-4',
    name: 'Leather Shoe Soles & Belts',
    duration: '40 to 50 Years',
    hazard: 'Moderate (Hexavalent Chromium Tanning)',
    energy: '60% Livestock Energy Conserved',
    stream: 'Specialized Leather / Landfill',
    desc: 'Dense collagen matrix preserved through chemical tanning. In landfills, industrial tannins and chromium salts resist bacterial cleavage for half a century.',
    visualType: 'leather',
    badge: 'BIO-GEO-05',
    halfLifeYears: 45,
    microplasticRisk: 'Minimal (Biogenic)',
    recoveryRate: 'Mechanically Reconstituted Leather'
  },
  {
    id: 'step-5',
    name: 'Tin-Plated Steel Food Cans',
    duration: '50 to 100 Years',
    hazard: 'Low (Surface Oxidation)',
    energy: '74% Iron Blast Furnace Conserved',
    stream: 'Blue Cart (Metals / Steel)',
    desc: 'Thin tin plating oxidizes first, exposing core carbon steel to moisture and oxygen. Rust converts the metal into iron oxide minerals over several decades.',
    visualType: 'steel',
    badge: 'BIO-GEO-06',
    halfLifeYears: 75,
    microplasticRisk: 'Zero (Elemental Ferrous)',
    recoveryRate: '100% Infinite Smelting Loop'
  },
  {
    id: 'step-6',
    name: 'Aluminum Beverage Can',
    duration: '200 to 500 Years',
    hazard: 'Surface Alumina Passivation Barrier',
    energy: '95% Primary Smelting Conserved',
    stream: 'Blue Cart (Aluminum Metals)',
    desc: 'Instantly forms a microscopic, diamond-hard aluminum oxide skin that shields the metal from further corrosion. Takes centuries to dissolve without metallurgical smelting.',
    visualType: 'aluminum',
    badge: 'BIO-GEO-07',
    halfLifeYears: 350,
    microplasticRisk: 'Zero',
    recoveryRate: '100% Infinite Melting Loop'
  },
  {
    id: 'step-7',
    name: 'Disposable Plastic Diaper',
    duration: '450 to 500 Years',
    hazard: 'Severe (Bacterial Leaching & Polyacrylate)',
    energy: '85% Synthetic Polymer Loss',
    stream: 'Landfill / Municipal Trash',
    desc: 'Super-absorbent polymer core (sodium polyacrylate) encased in polypropylene non-woven sheets. Compaction in deep anaerobic landfill strata preserves it indefinitely.',
    visualType: 'diaper',
    badge: 'BIO-GEO-08',
    halfLifeYears: 475,
    microplasticRisk: 'Extreme Microplastic Shedding',
    recoveryRate: 'High-Temperature Autoclave Only'
  },
  {
    id: 'step-8',
    name: 'PET Plastic Water Bottle',
    duration: '450 to 1,000 Years',
    hazard: 'Critical Microplastic Vector',
    energy: '88% Petrochemical Cracking Saved',
    stream: 'Blue Cart (PET #1 Plastics)',
    desc: 'Strong ester bonds defy biological enzymes. Solar UV photo-oxidation progressively fractures the bottle into millions of sub-micron particles that poison aquatic food chains.',
    visualType: 'plastic',
    badge: 'BIO-GEO-09',
    halfLifeYears: 650,
    microplasticRisk: 'Critical Oceanic Biomagnification',
    recoveryRate: '92% Pelletized Bottle-to-Bottle'
  },
  {
    id: 'step-9',
    name: 'Expanded Polystyrene (Styrofoam)',
    duration: '500+ Years',
    hazard: 'Extreme (Styrene Monomers & Fragmentation)',
    energy: '90% Virgin Monomer Conserved',
    stream: 'Designated EPS Drop-Off Center',
    desc: 'Composed of 95% air and 5% rigid polystyrene. Physical impacts shatter it into microscopic beads that absorb marine polychlorinated biphenyls (PCBs).',
    visualType: 'styrofoam',
    badge: 'BIO-GEO-10',
    halfLifeYears: 800,
    microplasticRisk: 'Catastrophic Marine Aerosol',
    recoveryRate: 'Densified Ingot Extrusion'
  },
  {
    id: 'step-10',
    name: 'Electronic PCB Circuit Board',
    duration: '1,000+ Years',
    hazard: 'Acute Toxic (Lead, Cadmium, Brominated FR)',
    energy: '99% Rare Earth & Gold Conserved',
    stream: 'Slate Depot (E-Waste / WEEE)',
    desc: 'Glass-reinforced epoxy laminate bound with copper traces and solder. Landfill acid rain leaches toxic lead and antimony directly into subterranean municipal aquifers.',
    visualType: 'ewaste',
    badge: 'BIO-GEO-11',
    halfLifeYears: 1200,
    microplasticRisk: 'Epoxy Micro-Resins & Heavy Metals',
    recoveryRate: '99% Hydrometallurgical Refining'
  },
  {
    id: 'step-11',
    name: 'Glass Beverage Container',
    duration: '1,000,000+ Years',
    hazard: 'Inert Geological Silica Matrix',
    energy: '30% Furnace Heat Conserved',
    stream: 'Blue Cart (Glass Recyclables)',
    desc: 'Essentially artificial metamorphic rock made of fused silica, soda ash, and limestone. Never biodegrades on human timescales, but 100% infinitely recyclable without quality loss.',
    visualType: 'glass',
    badge: 'BIO-GEO-12',
    halfLifeYears: 1000000,
    microplasticRisk: 'Zero (Pure Mineral Silicate)',
    recoveryRate: '100% Infinite Cullet Remelt'
  }
];

// Interactive Sorting Quiz / Challenge Database
const SORTING_QUIZ_ITEMS = [
  {
    name: 'Greasy Pizza Box Bottom',
    icon: '🍕',
    correctCategory: 'biodegradable',
    binColor: 'Green Bin',
    explanation: 'Grease and oil soak into cardboard fibers, making them impossible to separate in water pulpers. It belongs in the compost bin where microbes eat the fats!'
  },
  {
    name: 'Smartphone with Swollen Battery',
    icon: '📱',
    correctCategory: 'ewaste',
    binColor: 'Slate E-Waste Depot',
    explanation: 'Electronics with lithium batteries require specialized e-waste facilities. Curbside compactors can rupture swollen batteries, triggering explosive fires.'
  },
  {
    name: 'Aluminum Soda Can',
    icon: '🥫',
    correctCategory: 'recyclable',
    binColor: 'Blue Cart',
    explanation: 'Aluminum is 100% infinitely recyclable and conserves 95% of primary smelting energy when recycled!'
  },
  {
    name: 'Fluorescent CFL Light Bulb',
    icon: '💡',
    correctCategory: 'hazardous',
    binColor: 'Red Hazardous Depot',
    explanation: 'CFLs contain vaporized elemental mercury. Never toss them into regular trash or recycling where they can break and emit toxic vapors.'
  },
  {
    name: 'Crushed Plastic Water Bottle',
    icon: '🧴',
    correctCategory: 'recyclable',
    binColor: 'Blue Cart',
    explanation: 'Empty, rinse, replace the cap, and put it in the blue recycling cart for high-yield PET flaking.'
  },
  {
    name: 'Banana Peel & Apple Core',
    icon: '🍌',
    correctCategory: 'biodegradable',
    binColor: 'Green Bin',
    explanation: 'Organic fruit scraps decompose aerobically in compost into rich humus soil within 3 to 4 weeks!'
  },
  {
    name: 'Used Motor Engine Oil',
    icon: '🛢️',
    correctCategory: 'hazardous',
    binColor: 'Red Hazardous Depot',
    explanation: '1 gallon of dumped motor oil can contaminate 1,000,000 gallons of drinking water. Always drop off at certified auto depots.'
  },
  {
    name: 'Broken Ceramic Coffee Mug',
    icon: '☕',
    correctCategory: 'trash',
    binColor: 'Gray Landfill Bin',
    explanation: 'Ceramics have a much higher melting point than container glass. Putting ceramics in the blue glass cart contaminates whole batches of recycled glass!'
  }
];
