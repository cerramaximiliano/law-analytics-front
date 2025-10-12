// third-party
import dayjs from "./dayjs-config";
import { Chance } from "chance";
import lodash from "lodash";

const chance = new Chance();

export const range = (len: number) => {
	const arr = [];
	for (let i = 0; i < len; i += 1) {
		arr.push(i);
	}
	return arr;
};

const skills = [
	"UI Design",
	"Mobile App",
	"Web App",
	"UX",
	"Wireframing",
	"Prototyping",
	"Backend",
	"React",
	"Angular",
	"Javascript",
	"HTML",
	"ES6",
	"Figma",
	"Codeigniter",
];

const time = ["just now", "1 day ago", "2 min ago", "2 days ago", "1 week ago", "1 year ago", "5 months ago", "3 hours ago", "1 hour ago"];

// ==============================|| CUSTOM FUNCTION - TABLE DATA ||============================== //

function mockData(index: number) {
	return {
		id: (index: number) => `${chance.bb_pin()}${index}`,
		contact: chance.phone(),
		datetime: dayjs()
			.subtract(chance.integer({ min: 0, max: 30 }), "days")
			.subtract(chance.integer({ min: 0, max: 23 }), "hours")
			.subtract(chance.integer({ min: 0, max: 59 }), "minutes")
			.toDate(),
		address: {
			full: `${chance.address()}, ${chance.city()}, ${chance.country({
				full: true,
			})} - ${chance.zip()}`,
			country: chance.country({ full: true }),
		},
		folderName: `${chance.name()} C/ ${chance.name()}`,
		description: {
			title: chance.sentence({ words: chance.integer({ min: 4, max: 12 }) }),
			sentence: chance.sentence(),
			description: chance.paragraph,
		},
		number: {
			percentage: chance.integer({ min: 0, max: 100 }),
			rating: chance.floating({ min: 0, max: 5, fixed: 2 }),
			status: (min: number, max: number) => chance.integer({ min, max }),
			age: chance.age(),
			amount: chance.integer({ min: 1, max: 10000 }),
		},
		skill: lodash.sampleSize(skills, chance.integer({ min: 2, max: 6 })),
		time: lodash.sampleSize(time),
	};
}

export default mockData;
