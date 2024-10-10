from django.contrib import admin

from gamedata.models import Game, GameEdition, Publication, CharacteristicType, ProfileType, Profile, \
    ProfileCharacteristic

admin.site.register(Game)
admin.site.register(GameEdition)
admin.site.register(Publication)
admin.site.register(CharacteristicType)
admin.site.register(ProfileType)
admin.site.register(Profile)
admin.site.register(ProfileCharacteristic)
