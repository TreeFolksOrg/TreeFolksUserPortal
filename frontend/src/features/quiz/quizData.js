// Content for the pre-consultation quiz. Image files live in /public and are
// referenced by exact filename (captions are also encoded in some filenames).

export const PART_ONE_INTRO = {
  title: "Part 1 — Tell us about your current land management style",
  description:
    "There are no right or wrong answers to these first 6 questions. We are simply trying to understand how participation in our program affects your land management style. We will ask you these same questions again after planting.",
  streamNoteTitle: "“Stream”",
  streamNote:
    "In this quiz, we will use the word “stream” to refer to any body of water, including creeks, streams, rivers, and ponds. If your land does not include an actual stream, think of the part of your land most downhill or within the flood zone when answering questions about your land.",
};

export const PART_TWO_INTRO = {
  title: "Part 2 — Stream School",
  description:
    "No cheating... Please do not look up answers to the following questions. You will not be penalized for getting a less-than-ideal score. We are simply trying to gauge your baseline knowledge and understand how we can best help you. If you are unsure of an answer, go with your gut on these.",
  note: "After each question is answered, you will be given the correct answer along with an explanation. Think of this quiz as an interactive learning opportunity!",
};

export const CLOSING = {
  title: "Closing",
  image: "end of quiz.webp",
  paragraphs: [
    "Thank you for helping us reforest Central Texas floodplains!",
    "As President LBJ said, “Saving the water and the soil must start where the first raindrop falls.” This is especially true in Texas, where more than 90% of the land is privately owned. So, thank you, landowner, for doing your part to protect the waters and soils of Texas!",
  ],
};

export const PART_ONE_QUESTIONS = [
  {
    id: 1,
    text: "How frequently on average do you mow all the way to the edge or nearly to the edge of your stream?",
    options: [
      { key: "a", text: "Once a month or more" },
      { key: "b", text: "A few times a year" },
      { key: "c", text: "Once a year or less" },
      { key: "d", text: "Never" },
    ],
  },
  {
    id: 2,
    text: "How frequently do you clear brush, logs, and/or downed limbs from the land adjacent to your stream?",
    options: [
      { key: "a", text: "Once a month or more" },
      { key: "b", text: "A few times a year" },
      { key: "c", text: "Once a year or less" },
      { key: "d", text: "Never" },
    ],
  },
  {
    id: 3,
    text: "How much of your stream do you allow livestock to access?",
    options: [
      { key: "a", text: "They have full access" },
      { key: "b", text: "I have restricted their access to a small portion of the stream" },
      { key: "c", text: "They do not have any access" },
      { key: "d", text: "There are no livestock on my land" },
    ],
  },
  {
    id: 4,
    text: "What is your primary land management goal for this property?",
    options: [
      { key: "a", text: "Aesthetic beauty (the view)" },
      { key: "b", text: "Livestock and/or agriculture" },
      { key: "c", text: "Hunting, fishing, or other outdoor recreation" },
      {
        key: "d",
        text: "Wildlife habitat, land restoration or protection, invasive species mitigation, etc.",
      },
      { key: "e", text: "Minimal or no management (I let it go wild)" },
    ],
  },
  {
    id: 5,
    text: "Do you currently have any plans to remove invasive species near the stream?",
    options: [
      { key: "a", text: "Yes" },
      { key: "b", text: "No" },
    ],
  },
  {
    id: 6,
    text: "Do you currently have any plans to increase the diversity of native groundcover plants near your stream? This includes grasses, wildflowers, sedges, and other non-woody vegetation.",
    options: [
      { key: "a", text: "Yes" },
      { key: "b", text: "No" },
    ],
  },
];

export const PART_TWO_QUESTIONS = [
  {
    id: 1,
    text: "What is a riparian zone?",
    options: [
      { key: "a", text: "The area between the banks of a stream (i.e. the part with water in it)" },
      { key: "b", text: "Another term for a watershed" },
      { key: "c", text: "The strip of land next to a stream" },
      { key: "d", text: "All of the above" },
    ],
    correct: "c",
    explanation: [
      "Riparian vegetation along streams serves as a major food and habitat source for aquatic organisms, as well as numerous terrestrial wildlife and birds. Fallen trees and limbs that enter the stream provide habitat for fish and other aquatic species. Riparian zones also serve as migration routes and stopping points between habitats for a variety of wildlife. Healthy riparian zones provide habitat for 80% of wildlife species in the arid West at some point in their life. As you’ll see throughout this quiz, healthy riparian zones (and uplands!) provide many benefits for nature and humans alike!",
    ],
    answerImages: [{ file: "q1-answer.webp" }],
  },
  {
    id: 2,
    text: "What is a watershed?",
    image: { file: "q2.webp" },
    options: [
      { key: "a", text: "A small dam which allows water to run over the top" },
      { key: "b", text: "A low-lying water retention area, also known as a retention pond" },
      { key: "c", text: "An area of land that feeds all rain and creeks into a given stream" },
      { key: "d", text: "The strip of land next to a stream" },
    ],
    correct: "c",
    explanation: [
      "A watershed, also known as a river basin or catchment area, is based on the shape of the land and is defined by the body of water it drains into. Elevation in the landscape forms a funnel where tributaries run downhill and feed into larger streams. With proper land management, precipitation can be captured and stored underground throughout a watershed, helping retain soil moisture. When rainwater has the opportunity to soak into the landscape, vegetation thrives, streams stay full longer, and water is filtered as it percolates into the ground before reaching aquifers.",
      "This is also why rain falling on your neighbor’s hill is your business, and why what happens on your land is your neighbor’s. Everything inside the funnel is connected, whether or not you can see water from where you are standing.",
      "Note that answer d. describes a riparian zone — the answer to the previous question. The two get mixed up constantly, which is why they are worth learning together.",
    ],
    answerImages: [
      {
        file: "q2-answer caption-Meredith McCord from Houston holds over 100 fishing world records.webp",
        caption: "Meredith McCord from Houston holds over 100 fishing world records",
      },
      {
        file: "q2-answer2 caption-Geronimo Creek.webp",
        caption: "Geronimo Creek",
      },
    ],
  },
  {
    id: 3,
    text: "Which of the following makes for the HEALTHIEST, most functional riparian zone?",
    options: [
      { key: "a", text: "A wide band of large trees shading the stream with no brush or tall grass" },
      { key: "b", text: "A wide band of trees, brush, and tall grass next to the stream" },
      { key: "c", text: "Tall grasses and brush along the edge of the stream" },
      { key: "d", text: "Mown grass to the edge of the stream" },
      { key: "e", text: "All are equally good" },
    ],
    correct: "b",
    explanation: [
      "And the wider, the better. A streambank is a hotspot for a variety of plant life, which creates habitat for animals both on land and in the water. And healthier streams can lead to more, bigger, and healthier fish!",
      "As you’ll see in this quiz, abundant plant and wildlife are just one measure of the health of a riparian zone. Disruptions to the balance can cause erosion, lower the water table, and carry pollutants and excessive sediment loads. Wide riparian forest buffers with diverse plant communities provide the most ecological benefits to streams, wildlife, and humans.",
    ],
    answerImages: [{ file: "q3-answer.webp" }],
  },
  {
    id: 4,
    text: "What is an ECONOMIC benefit of a functional riparian zone?",
    options: [
      { key: "a", text: "Reduced electricity bills" },
      { key: "b", text: "Flood protection" },
      { key: "c", text: "Reduced state and local fees, water bill, and/or taxes" },
      { key: "d", text: "Increased property values" },
      { key: "e", text: "All of the above" },
    ],
    correct: "e",
    explanation: [
      "a. Reduced electricity bills: Properly placed trees around homes can reduce heating and cooling costs throughout the year by providing wind barriers in the cooler months and shade in the hotter months. Even trees that don't directly shade the house can have this benefit. Regional cooling, which results from the shade of riparian vegetation and the lower temperatures of nearby waters, can reduce electricity bills not just within the riparian zone but in nearby uplands, too.",
      "b. Flood protection: Healthy riparian zones reduce flooding and reduce the damage floods do to fences, low-water crossings, pasture, and soil. Water that soaks into the ground does not arrive at the stream all at once.",
      "c. Reduced state and local fees, water bill, and/or taxes: Reduced pollution and sediments entering waterways can reduce strain on water treatment plants, thus reducing your fees, water bill, and/or taxes.",
      "d. Increased property values: Mature trees add value to a property, and property values also remain higher due to reduced loss of acreage to erosion and a more lush landscape.",
    ],
    answerImages: [],
  },
  {
    id: 5,
    text: "Which configuration most REDUCES FLOODING and streambank EROSION?",
    options: [
      {
        key: "a",
        text: "A smooth, impervious structure, such as concrete, which allows all water to reach the stream as quickly as possible",
      },
      { key: "b", text: "A mown lawn with few impediments, such as bushes and downed logs" },
      {
        key: "c",
        text: "A moderately vegetated landscape which allows some water to reach the stream at a moderate rate",
      },
      {
        key: "d",
        text: "A highly vegetated landscape that prevents most water from reaching the stream quickly",
      },
    ],
    correct: "d",
    explanation: [
      "A highly vegetated landscape allows rain to soak into the ground before reaching streams. This means there will be less water rushing through the stream, reducing flooding. This process also slows down and filters rain, reducing streambank erosion, catching sediment and pollutants, and helping build up healthy soil. When more rainwater is captured within the landscape, streams flow more gently, and erosion is reduced. In contrast, sparse vegetation and impervious groundcover quickly shed rain as runoff, which causes scouring along streambanks, allows more pollutants to enter waterways, and can allow a torrent of water to quickly fill the stream.",
    ],
    answerImages: [{ file: "q5-answer.webp" }],
  },
  {
    id: 6,
    text: "What is another reason it is better to have many different types of vegetation than to have only one type of grass or tree?",
    options: [
      { key: "a", text: "It prevents a riparian zone from being boring" },
      { key: "b", text: "It prevents hogs from tearing up the streambank" },
      { key: "c", text: "It prevents Ashe juniper (nicknamed cedar) from growing" },
      { key: "d", text: "It prevents plant diseases and pests from taking over" },
      { key: "e", text: "All of the above" },
    ],
    correct: "d",
    explanation: [
      "Among other things, having multiple species instead of just one, a monoculture, prevents a single disease or insect from wiping out the entire population of trees or vegetation (think of oak wilt). Some species are weak against certain diseases or pests. But if you have a diverse set of plants on your streambank, even if one species does suffer, others remain to hold the bank intact. Additionally, when plants are intermingled with other plant species, it is harder for a disease or pest to spread from plant to plant. Think of it like social distancing for plants. This concept applies to all of your land, not just the floodplains.",
    ],
    answerImages: [{ file: "q6-answer.webp" }],
  },
  {
    id: 7,
    text: "How deep can the roots of some of our native Texas grasses get?",
    options: [
      { key: "a", text: "Less than 1 foot" },
      { key: "b", text: "1 to 3 feet" },
      { key: "c", text: "4 to 10 feet" },
      { key: "d", text: "11 to 20 feet" },
    ],
    correct: "d",
    explanation: [
      "There are many native grasses and herbs whose roots can reach over 10 feet deep. Compare this to lawn turfgrass which typically has roots that are less than 6 inches deep. You can barely see the Kentucky bluegrass (native to Europe) on the far left of the diagram below. A higher biomass above ground generally equals a higher biomass below ground. That is, more leaf = more root. And more root = more stable soil.",
    ],
    answerImages: [{ file: "q7-answer.webp" }],
  },
  {
    id: 8,
    text: "Which of the following leads to the most stable, EROSION RESISTANT streambank?",
    options: [
      { key: "a", text: "A mixture of trees" },
      { key: "b", text: "A mixture of shrubs" },
      { key: "c", text: "A mixture of deep-rooted grasses" },
      { key: "d", text: "A mixture of shallow-rooted grasses" },
      { key: "e", text: "A combination of all of the above" },
    ],
    correct: "e",
    explanation: [
      "A combination of thick, thin, deep, and shallow roots growing through one another create an interlocking net that holds soil — and trees! — in place. This serves a similar function to rebar in concrete, and it helps prevent erosion during both normal rains and flood events.",
      "Trees, shrubs, deep-rooted grasses, and shallow-rooted grasses each contribute something different. Together they hold the soil, and each other in place.",
    ],
    answerImages: [{ file: "q8-answer.webp" }],
  },
  {
    id: 9,
    text: "All of the following are reasons that AGE DIVERSITY is important in a forest, EXCEPT (which one is false?)",
    options: [
      { key: "a", text: "Older trees can shade younger trees and protect them while they get established" },
      { key: "b", text: "Too much shade from only older, larger trees can be harmful to stream temperature" },
      { key: "c", text: "Age diversity helps protect the vegetation from natural disasters" },
      { key: "d", text: "Age diversity helps maintain continued forest cover beyond the life of the oldest trees" },
    ],
    correct: "b",
    explanation: [
      "The truth is, older, larger trees will NOT put too much shade on a stream. Shade is not harmful to stream temperatures and is very beneficial for aquatic wildlife.",
      "Age and size diversity in riparian vegetation is important for the following reasons:",
      "a. Older and/or larger trees can shade younger ones while they become established, acting as a nursery.",
      "c. Size diversity helps protect vegetation from natural disasters by slowing down and dissipating the energy from flood waters and high winds.",
      "d. Age diversity helps maintain continued forest cover beyond the life of the oldest trees: when older trees die, there are smaller trees waiting to take their place.",
      "Case Study: When the 2015 Memorial Day flood ravaged the Blanco River, it wiped out 85% of the riverside canopy. This was partly because most properties along the river had only mature Bald Cypress trees with lawns mown to the river’s edge. Since there were no younger trees or shrubs in place to help dissipate the energy of the floodwaters or replace trees that fell, it will be decades before a mature canopy can establish along the streambank.",
    ],
    answerImages: [{ file: "q9-answer.webp" }],
  },
  {
    id: 10,
    text: "All of the following are reasons that SIZE DIVERSITY (tall trees, mid-level shrubs and trees, and lower grasses and herbs) helps maintain a healthy riparian zone, EXCEPT (which one is false?)",
    options: [
      {
        key: "a",
        text: "Shrubs, smaller trees, and briars can keep livestock out and protect streambanks from trampling and overgrazing",
      },
      { key: "b", text: "It helps maintain a cooler water temperature, which is important for fish" },
      { key: "c", text: "It reduces the speed of floodwaters by creating resistance to passing water" },
      { key: "d", text: "It prevents raindrops from directly impacting the ground and thus reduces erosion" },
    ],
    correct: "a",
    explanation: [
      "The truth is, shrubs, smaller trees, and briars are not a reliable way to keep livestock out of a riparian zone. Livestock should be fenced out of sensitive riparian areas where they are likely to spend most of their time in the shade and near the water. Rotational grazing, limited stream access points, and watering tanks/ponds away from the stream are alternatives to unrestricted access to the streambanks.",
      "Size diversity DOES provide the following benefits:",
      "b. It helps maintain cooler water temperatures, which is important for fish and other aquatic organisms. Fish are sensitive to increases in water temperature.",
      "c. It reduces the speed of floodwaters by creating resistance to passing water.",
      "d. It prevents raindrops from directly impacting the ground, thus reducing erosion. Raindrops can act like thousands of tiny hammer blows, loosening the soil. They can then wash the soil into the stream, eroding the land and the streambank. Many layers of vegetation slow down raindrops and lessen their impact on soil.",
    ],
    answerImages: [{ file: "q10-answer.webp" }, { file: "q10-answer2.webp" }],
  },
  {
    id: 11,
    text: "What is an invasive species?",
    options: [
      {
        key: "a",
        text: "A native species that becomes harmful to its native environment after human alterations to its habitat or ecosystem",
      },
      { key: "b", text: "A non-native species that takes over an area and excludes native species from thriving there" },
      { key: "c", text: "Many of the plants commonly sold in garden centers" },
      { key: "d", text: "All of the above" },
    ],
    correct: "d",
    explanation: [
      "While an invasive species can be either native or non-native, non-native species are more likely to become invasive. Native species typically become a problem only after humans have altered their habitat or ecosystem to such a degree that the ecosystem is thrown out of balance. An example would be clearing land for cattle grazing combined with the suppression of the natural fire cycle, leading to an overabundance of Ashe juniper (nicknamed cedar). Ashe juniper would normally only be found in ravines and intermixed with oaks and other species — it belongs here, and has spread to areas where it wasn’t found before, due to the chopping down of old-growth forests and overgrazing.",
      "Humans often aid the movement of species around the globe, sometimes with disastrous effects. Sometimes people move these plants, animals, and insects on purpose, such as for pets or gardening, not realizing the harm it will cause. Other times, these species, including pests and pathogens, are accidentally transported, such as when hidden on plants, food, and lumber shipped internationally.",
      "Shockingly, many invasive plants are still sold in gardening centers. So it is up to all of us to ensure we only purchase native plants. They are usually proudly labeled as NATIVE (but just because they say \"Texas\" or have a Texas flag on them doesn’t mean they’re native. Gardening centers often use such deceptive labeling tactics. So, read the label, or better yet, look it up, to check if it is native. By the way, Vitex is NOT native and is, in fact, invasive in many areas. Here is a hint at its origin: it is also called Chinese chaste tree.",
      "Be careful not to confuse Western soapberry with Chinaberry. Western soapberry is a very hardy native tree that is great for wildlife (and its berries can be used to make soap!). Their seeds look a bit alike, so double-check before you chop.",
    ],
    answerImages: [{ file: "q11-answer.webp" }, { file: "q11-answer2.webp" }],
  },
  {
    id: 12,
    text: "Why is it important to use only native species in landscaping and restoration, ESPECIALLY near a stream?",
    options: [
      { key: "a", text: "Invasive species often spread easily" },
      { key: "b", text: "Some wildlife are dependent on native species" },
      { key: "c", text: "Invasive species can create a monoculture (an area where only one species lives)" },
      { key: "d", text: "Most invasive species do not provide important ecological benefit" },
      { key: "e", text: "All of the above" },
    ],
    correct: "e",
    explanation: [
      "Not only do invasive species often spread easily, but this is especially true near streams which can provide a corridor for easy dispersal by wind and water. They can then create monocultures which are susceptible to pests and pathogens. Also, many species are dependent on native plants for their survival. For example, the endangered Golden-cheeked Warbler nests exclusively in Ashe junipers (nicknamed cedar) more than 40 years old and uses Ashe juniper bark to build its nests. Invasive species do not have these types of benefits for our native Texas landscape.",
    ],
    answerImages: [{ file: "q12-answer.webp" }],
  },
  {
    id: 13,
    text: "Ashe juniper (nicknamed cedar) trees are:",
    options: [
      { key: "a", text: "A non-native tree brought to Texas in the 1800s" },
      { key: "b", text: "A native Texas tree" },
      { key: "c", text: "Listed as an invasive species by the State of Texas" },
      { key: "d", text: "Native to East Texas, but not to Central Texas" },
    ],
    correct: "b",
    explanation: [
      "Cedar takes more abuse than any tree in the Hill Country, and most of it is aimed at the wrong target. Ashe juniper is native here. It is not an import and is not on any invasive species list, although it was incorrectly labeled as not native for many years in the City of Austin’s Environmental Criteria Manual.",
      "What changed is how much of it there is. It once held the ravines and canyon slopes and mixed in among the oaks; clearing land for grazing while suppressing the natural fire cycle let it spread onto ground it would never have held on its own. That is a density problem, not a foreign species problem — and thinning a thick stand can be perfectly good fire management.",
      "It also does real work. As you saw in the last question, the endangered Golden-cheeked Warbler nests nowhere on earth but Central Texas, and builds those nests from bark that only mature Ashe juniper — roughly 40 years and older — produces. No old cedar, no warbler. Its berries feed birds and mammals through the winter, and on thin rocky soils, its shade and leaf litter protect the ground where little else will hold. Ashe juniper creates rich soil, and its roots break through limestone, creating cracks through which rainfall can seep into the ground to recharge aquifers and reduce hillside erosion.",
      "You may have heard that cedar drinks more water than other trees, but recent studies show that they consume similar or less amounts of water than live oak trees. The old myth about cedars being “water hogs” was based on a 1996 study of a single tree, but the media ran it, and the misinformation was quickly adopted as fact. This study claimed that all junipers consumed 33 gallons per day, whereas updated studies using better data show they consume closer to 6 gallons per day, depending on weather and size.",
    ],
    answerImages: [],
  },
  {
    id: 14,
    text: "Mesquite trees are:",
    options: [
      { key: "a", text: "A non-native tree that spread into Texas from Mexico" },
      { key: "b", text: "An invasive species with no ecological value" },
      { key: "c", text: "A native Texas tree that improves the soil beneath it" },
      { key: "d", text: "Native, but harmful to most plants growing around it" },
    ],
    correct: "c",
    explanation: [
      "Mesquite was part of the Texas landscape long before settlement. And because it is a legume — the same family as beans and clover — it pulls nitrogen from the air and puts it into the soil. Soil beneath a mesquite canopy can hold three to seven times as much nitrogen as the open ground between trees. It is fertilizing your pasture for free.",
      "And it does more than that. Mesquite shelters seedlings of other species while they get established, its pods feed cattle, deer, turkey, and quail, and its flowers are a serious nectar source used by pollinators — mesquite honey exists for a reason.",
      "As with cedar, what changed was density rather than belonging. Overgrazing removed the grass that carried fire, cattle spread the seed, and open savanna thickened into brush. Thinning a thicket can make sense. Writing mesquite off as a weed with no value does not.",
    ],
    answerImages: [],
  },
  {
    id: 15,
    text: "Does a high volume of native vegetation along a streambank, such as thick grass and shrubs, lower the water level in a stream, especially during drought?",
    options: [
      { key: "a", text: "Yes" },
      { key: "b", text: "No" },
    ],
    correct: "b",
    explanation: [
      "Native vegetation along a streambank does NOT lower the water level in a stream. A highly vegetated streambank can actually help maintain a steady water level in a stream. It does this in multiple ways. First, the plants help keep the water level lower during rains and flooding events by storing that water within themselves and absorbing it into the soil. Later, this water can slowly trickle into the stream (similar to setting a soaked sponge on the counter... the water will slowly leak out). This helps create a steadier water level. However, some invasive species, such as arundo or giant reed, can cause a lot of harm to riparian areas, including taking more water out than they put back in.",
    ],
    answerImages: [{ file: "q15-answer.webp" }],
  },
  {
    id: 16,
    text: "Do UPLANDS have a major impact on flooding and water quality?",
    options: [
      { key: "a", text: "Yes" },
      { key: "b", text: "No" },
    ],
    correct: "a",
    explanation: [
      "Uplands can have a major impact on flooding and water quality! By slowing down rainwater as it moves across landscapes toward streams, upland vegetation not only reduces pollutants entering streams, but it can also reduce flooding and erosion. It does this the same way riparian vegetation does: by slowing the flow of water and allowing it to be taken up by plants and filter into the soil. Compare this to a more impervious structure, such as bare, compacted soil or a concrete parking lot. In these types of landscapes, most rainwater runs off quickly, overwhelming streams with unfiltered runoff.",
    ],
    answerImages: [{ file: "q16-answer.webp" }],
  },
  {
    id: 17,
    text: "In order to prepare my land for a TreeFolks planting, I should:",
    options: [
      { key: "a", text: "Remove any dead trees, downed limbs, and logs from the planting area" },
      { key: "b", text: "Remove invasive species when possible and plant native grasses and herbs if needed" },
      { key: "c", text: "Remove any large boulders obstructing the planting area" },
      { key: "d", text: "Mow the area to be planted to make it easier for the planting crew" },
      { key: "e", text: "All of the above" },
    ],
    correct: "b",
    explanation: [
      "Please DO NOT MOW the area to be planted. Through this program, participants create \"Grow Zones\" in areas considered for reforestation. If you are able to seed native grasses and wildflowers in the planting areas, it will not only help wildlife and prevent further erosion but also protect the trees we plant on your property and look beautiful! If you do not plan to seed your planting areas, you can simply stop mowing and fence out livestock from grazing them.",
      "Please avoid disturbing the native vegetation, downed limbs, boulders, etc., and avoid anything that disturbs or exposes the soil. This is the best way to prepare the area for planting and will prevent you from accidentally mowing down the trees that TreeFolks plants for you.",
      "Don’t mow; let it grow!",
    ],
    answerImages: [{ file: "q17-answer.webp" }, { file: "q17-answer2.webp" }],
  },
  {
    id: 18,
    text: "Why should you NOT mow your planting area before TreeFolks plants trees for you?",
    options: [
      { key: "a", text: "Tall vegetation can shade the ground and keep the soil from drying out" },
      {
        key: "b",
        text: "Tall, lush vegetation creates a microclimate and acts as a more shady, more humid nursery for the saplings",
      },
      { key: "c", text: "Tall vegetation helps hide saplings from deer and other browsers" },
      {
        key: "d",
        text: "Not mowing will allow some species of trees, shrubs, and grasses to begin growing in on their own",
      },
      { key: "e", text: "All of the above" },
    ],
    correct: "e",
    explanation: [
      "Please DO NOT MOW the planting area(s) going forward. Growing a forest requires many years of patience and can appear a bit ‘messy’ to those who are accustomed to a manicured landscape. Growing vegetation is the first step in establishing a forest and allows natural processes to occur. This vegetation creates a nursery for young planted trees, offering protection and increasing their chance of survival. Eventually, trees will outgrow this nursery and shade out most of the vegetation below. Riparian vegetation helps trap sediment and seeds from nearby and upstream trees and grasses, while building more stable soil and reducing erosion throughout the process.",
    ],
    answerImages: [
      {
        file: "q18-answer caption- Young Bald Cypress trees we planted along the Blanco River being shaded in their tall grass nursery.webp",
        caption:
          "Young Bald Cypress trees we planted along the Blanco River being shaded in their tall grass nursery",
      },
      { file: "q18-answer2.webp" },
    ],
  },
];
