import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { PricequoteDetail } from "src/pricequote-details/entities/pricequote-detail.entity";
import { Status } from "src/status/status.enum";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Pricequote extends BaseWithCreatedBy {
    @Column()
    fullName: string
    @Column()
    phone: string
    @Column()
    address: string
    @Column()
    email: string
    @Column()
    messages: string
    @Column({
        type: 'enum',
        enum: Status,
        default: Status.PENDING,
    })
    status: Status;

    @OneToMany(() => PricequoteDetail, detail => detail.pricequote, { cascade: true })
    details: PricequoteDetail[];
}
