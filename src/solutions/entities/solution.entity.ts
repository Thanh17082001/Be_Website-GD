import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Column, Entity } from "typeorm";

@Entity()
export class Solution extends BaseWithCreatedBy{
    @Column()
    title: string

    @Column()
    content: string
}
