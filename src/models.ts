import { Festivals } from './festivals';
import { ShoeDTO } from './shoeDTO';
import { ShoeTypes } from './shoeTypes';
export class ShoeModels {

    public static models: ShoeDTO[] = [
        {
            id: 1,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'white',
            imgurl: 'https://groovyfox.bg/wp-content/uploads/2018/10/Bride1.jpg',
            locations: [Festivals.Athens, Festivals.Belgrade, Festivals.Sofia],
            name: 'Classy Foxes',
            price: 112,
            type: ShoeTypes.heels,
        },
        {   id: 2,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'pink',
            imgurl: 'https://groovyfox.bg/wp-content/uploads/2018/04/pink1-1.jpg',
            locations: [Festivals.Athens, Festivals.Belgrade, Festivals.Sofia],
            name: 'Furry Foxes',
            price: 114,
            type: ShoeTypes.heels,
        },
        {
            id: 3,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'brown',
            imgurl: 'https://groovyfox.bg/wp-content/uploads/2018/04/MBR02029-copy-wh.jpg',
            locations: [Festivals.Athens, Festivals.Belgrade, Festivals.Sofia],
            name: 'Sleek Foxes',
            price: 118,
            type: ShoeTypes.oxfords,
        },
        {
            id: 4,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'red',
            imgurl: 'https://groovyfox.bg/wp-content/uploads/2018/04/MBR01978-wh.jpg',
            locations: [Festivals.Athens, Festivals.Belgrade, Festivals.Sofia],
            name: 'Sleek Foxes',
            price: 118,
            type: ShoeTypes.oxfords,
        },
        {
            id: 5,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'pink',
            imgurl: 'https://www.lindybop.co.uk/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/s/n/sneaker-magenta-polka7_2_.jpg',
            locations: [Festivals.Sofia],
            name: 'Casual Foxes',
            price: 22,
            type: ShoeTypes.trainers,
        },
        {
            id: 6,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'blue',
            imgurl: 'https://www.lindybop.co.uk/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/s/n/sneaker-cobalt-polka6_2_.jpg',
            locations: [Festivals.Sofia],
            name: 'Casual Foxes',
            price: 22,
            type: ShoeTypes.trainers,
        },
        {
            id: 7,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'red',
            imgurl: 'https://www.lindybop.co.uk/media/catalog/product/cache/1/small_image/365x437/9df78eab33525d08d6e5fb8d27136e95/i/v/ivy-09-r.jpg',
            locations: [Festivals.Sofia],
            name: 'Cute Foxes',
            price: 20,
            type: ShoeTypes.flats,
        },
        {
            id: 8,
            // tslint:disable-next-line:object-literal-sort-keys
            colour: 'black',
            imgurl: 'https://www.lindybop.co.uk/media/catalog/product/cache/1/small_image/365x437/9df78eab33525d08d6e5fb8d27136e95/i/v/ivy-09-b.jpg',
            locations: [Festivals.Sofia],
            name: 'Cute Foxes',
            price: 20,
            type: ShoeTypes.flats,
        },
    ];
}
