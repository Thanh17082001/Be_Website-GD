import { CartDetail } from "src/cart-detail/entities/cart-detail.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Cart extends BaseWithCreatedBy {

    @OneToMany(() => CartDetail, (detail) => detail.cart, {
        cascade: true,
        // eager: true,
    })
    details: CartDetail[];
}
